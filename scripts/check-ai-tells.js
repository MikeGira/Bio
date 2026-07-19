// Content lint: blocks AI-tell punctuation and canned LLM phrasing from user-facing HTML.
// Why: em/en dashes and stock LLM phrases read as AI-generated ("AI slop") to recruiters.
// The rule is that portfolio copy must read as human-written, so this gate makes it
// impossible to ship a page that contains these tells. Extend AI_PHRASES as new tells show up.
//
// Scope note: intentionally scans *.html (the rendered pages) only. Code comments and the
// Phoenix system prompt are not user-facing; Phoenix's own output is stripped of dashes at
// runtime (phoenix.js) and instructed against them in its prompt. Never regex-sweep CSS/JS
// blocks for dashes — a past sweep stripped calc() minus signs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', 'node_modules', '.vercel', '.github']);
const DASHES = /[—–]/; // em dash, en dash
const AI_PHRASES = [
  /\bas an ai\b/i,
  /in today's (fast-paced|digital|modern|ever-changing) world/i,
  /\bdelve into\b/i,
  /it's worth noting that/i,
  /\bunleash the power\b/i,
  /\ba testament to\b/i,
];

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (extname(full) === '.html') out.push(full);
  }
  return out;
}

const failures = [];
for (const file of walk(ROOT)) {
  const rel = file.slice(ROOT.length + 1);
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (DASHES.test(line)) failures.push(`${rel}:${i + 1}  em/en dash: ${line.trim().slice(0, 100)}`);
    for (const rx of AI_PHRASES) {
      if (rx.test(line)) failures.push(`${rel}:${i + 1}  AI phrase (${rx.source}): ${line.trim().slice(0, 100)}`);
    }
  });
}

if (failures.length) {
  console.error(`AI-tell check FAILED (${failures.length} occurrence(s)):\n`);
  for (const f of failures) console.error('  ' + f);
  console.error('\nReplace em/en dashes with commas, periods, parentheses, or hyphens. Remove canned LLM phrasing. Write like a human.');
  process.exit(1);
}
console.log('AI-tell check passed: no em/en dashes or canned LLM phrasing in user-facing HTML.');
