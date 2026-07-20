// Guards the code-scanning security overview against two stale-state faults it
// surfaces as "configuration error" / "<tool> is reporting warnings":
//   1. A whole scanner removed from a workflow (e.g. checkov) but its old
//      analyses linger - GitHub keeps expecting the tool.
//   2. A live tool whose *job name or category changed* (e.g. CodeQL's
//      `deploy.yml:security-scan` -> `:code-scan` -> explicit `/language:*`),
//      orphaning the old configuration so it reads "results may be out of date".
//
// GitHub's documented remedy for both is to delete the stale configuration's
// analyses. Detection is per-configuration (tool + category) and cadence-
// relative, not name-based: whichever configurations are still wired up keep
// producing fresh analyses (the "heartbeat"); a configuration whose newest
// analysis has fallen far behind that heartbeat is orphaned and auto-cleared.
// A configuration still updating but whose newest analysis reports an `error`
// is a live-but-broken scan - flagged for a human, never auto-deleted.

const GH_TOKEN = process.env.GH_TOKEN;
const REPO = process.env.REPO;
// How far a configuration's newest analysis may lag the freshest configuration
// before it is treated as orphaned. 14 days clears removed/renamed configs
// while staying above any real scan cadence in this repo (CodeQL runs per push).
const STALE_DAYS = Number(process.env.CS_STALE_DAYS || 14);
const MAX_PAGES = Number(process.env.CS_MAX_PAGES || 40);
const LABEL = 'code-scanning-health';

if (!GH_TOKEN) { console.error('Missing GH_TOKEN'); process.exit(1); }
if (!REPO) { console.error('Missing REPO'); process.exit(1); }

const API = `https://api.github.com/repos/${REPO}`;
const HEADERS = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function gh(path, options = {}) {
  return fetch(path.startsWith('http') ? path : `${API}${path}`, {
    ...options,
    headers: { ...HEADERS, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
}

// Group default-branch (refs/heads/main) analyses by configuration - the
// (tool, category) tuple GitHub's tool-status page keys on. PR-ref analyses are
// ephemeral and never drive the overview. `anyErrored` tracks whether *any*
// analysis in the config errored: GitHub's overview aggregates errors across a
// config's whole history, so a clean latest scan does not clear an old errored
// one - it must be surfaced (and, at the source, prevented via `concurrency`).
async function collectConfigs() {
  const configs = new Map();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await gh(`/code-scanning/analyses?per_page=100&page=${page}`);
    if (res.status === 404) return configs; // code scanning never configured
    if (!res.ok) throw new Error(`List analyses failed: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    if (rows.length === 0) break;
    for (const a of rows) {
      if (a.ref !== 'refs/heads/main') continue;
      const tool = a.tool?.name ?? 'unknown';
      const category = a.category ?? a.analysis_key ?? '(default)';
      const key = `${tool}::${category}`;
      const c = configs.get(key) ?? { tool, category, newest: 0, newestId: null, count: 0, anyErrored: false };
      c.count++;
      if (a.error && a.error.trim()) c.anyErrored = true;
      const ts = Date.parse(a.created_at);
      if (ts > c.newest) {
        c.newest = ts;
        c.newestId = a.id;
      }
      configs.set(key, c);
    }
    if (rows.length < 100) break;
  }
  return configs;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// DELETE with backoff on GitHub's secondary rate limit for mutations (403/429
// with Retry-After, or transient 503). A long stale set is deleted one analysis
// at a time, so unretried throttling would abort the whole chain mid-way.
async function deleteWithRetry(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await gh(url, { method: 'DELETE' });
    if (res.ok) return res;
    if ([403, 429, 503].includes(res.status)) {
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      await sleep(Math.max(retryAfter * 1000, 2000 * 2 ** attempt));
      continue;
    }
    throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
  }
  throw new Error(`Delete gave up after retries: ${url}`);
}

// Delete a configuration's analyses by walking next_analysis_url from its newest
// entry. The chain stays within the (tool, category, ref) set, so sibling
// configurations that share an analysis_key are untouched. confirm_delete=true
// is required to remove the last analysis in the set.
async function deleteConfigAnalyses(newestId) {
  let url = `${API}/code-scanning/analyses/${newestId}?confirm_delete=true`;
  let deleted = 0;
  while (url) {
    const res = await deleteWithRetry(url);
    deleted++;
    const body = await res.json();
    url = body.next_analysis_url ? `${body.next_analysis_url}?confirm_delete=true` : null;
    await sleep(750); // pace mutations to stay under the secondary rate limit
  }
  return deleted;
}

async function getOpenIssues() {
  const res = await gh(`/issues?labels=${LABEL}&state=open`);
  if (!res.ok) return [];
  const issues = await res.json();
  return Array.isArray(issues) ? issues : [];
}

async function ensureLabel() {
  const res = await gh('/labels', {
    method: 'POST',
    body: JSON.stringify({ name: LABEL, color: '5319e7', description: 'Automated code-scanning configuration health findings' }),
  });
  if (!res.ok && res.status !== 422) console.warn(`Label create returned ${res.status}`);
}

async function report(findings) {
  const today = new Date().toISOString().slice(0, 10);
  const body = `## Code Scanning Health - ${today}\n\n${findings.map(f => `- ${f}`).join('\n')}\n\n---\n*Generated by the [Workflow Health Guard](../../actions/workflows/workflow-health.yml). Orphaned configurations are cleared automatically; a live configuration reporting errors needs a human to fix or remove its workflow.*`;
  const open = await getOpenIssues();
  if (open.length > 0) {
    const res = await gh(`/issues/${open[0].number}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
    if (!res.ok) throw new Error(`Comment failed: ${res.status} ${await res.text()}`);
    console.log(`Appended findings to existing issue #${open[0].number}`);
    return;
  }
  await ensureLabel();
  const res = await gh('/issues', {
    method: 'POST',
    body: JSON.stringify({ title: `Code Scanning Health: attention needed [${today}]`, body, labels: [LABEL] }),
  });
  if (!res.ok) throw new Error(`Issue create failed: ${res.status} ${await res.text()}`);
  console.log(`Issue created: ${(await res.json()).html_url}`);
}

async function closeOpenIssues() {
  for (const issue of await getOpenIssues()) {
    await gh(`/issues/${issue.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
    });
    console.log(`Code scanning config healthy - closed issue #${issue.number}`);
  }
}

async function main() {
  const configs = await collectConfigs();
  if (configs.size === 0) {
    console.log('No code-scanning analyses found - nothing to guard.');
    await closeOpenIssues();
    return;
  }
  // Global heartbeat: the freshest configuration across all tools. An orphaned
  // config (removed tool or renamed job/category) falls far behind it while
  // every live config sits at ~0 lag.
  const heartbeat = Math.max(...[...configs.values()].map(c => c.newest));
  const findings = [];
  let needsHuman = false;

  for (const c of configs.values()) {
    const label = `${c.tool} [${c.category}]`;
    const lagDays = (heartbeat - c.newest) / 86400000;
    if (lagDays > STALE_DAYS) {
      const deleted = await deleteConfigAnalyses(c.newestId);
      findings.push(`**Auto-remediated:** \`${label}\` was an orphaned configuration - its newest analysis lagged the active scan by ${Math.floor(lagDays)} days (threshold ${STALE_DAYS}). Deleted ${deleted} stale ${deleted === 1 ? 'analysis' : 'analyses'}, clearing the "out of date"/"configuration error" flag.`);
      console.log(`${label}: orphaned (lag ${Math.floor(lagDays)}d) -> deleted ${deleted}`);
    } else if (c.anyErrored) {
      findings.push(`**Errored analyses in a live configuration:** \`${label}\` has one or more errored analyses in its history (GitHub aggregates these into the overview's "reporting errors" banner even when the latest scan is clean). Usually a benign "exit code: 0" upload race - confirm \`concurrency\` is set on the scanning workflow, then delete the errored analyses newest-first down through them (\`gh api -X DELETE .../code-scanning/analyses/<id>?confirm_delete=true\`). Not auto-deleted: removing mid-history analyses also drops newer ones.`);
      console.log(`${label}: has errored analyses in history - flagged`);
      needsHuman = true;
    } else {
      console.log(`${label}: healthy (${c.count} analyses, newest lag ${lagDays.toFixed(1)}d)`);
    }
  }

  if (findings.length === 0) {
    await closeOpenIssues();
    console.log('Code scanning configuration healthy.');
    return;
  }
  await report(findings);
  if (needsHuman) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
