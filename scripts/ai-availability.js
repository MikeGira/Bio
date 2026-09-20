// Shared by the AI audit scripts. Separates "the code failed the audit" from "the auditor was
// unreachable", because those need different reactions and the run log conflated them.
//
// Origin: 2026-09-20. The Anthropic credit balance ran out, both audit jobs threw a raw
// `Anthropic 400: {...}` and exited 1, and the notification email said only "Run failed".
// Nothing named the cause, so a billing problem read as a code defect.

// Provider-side conditions that say nothing about the code under audit. A 400 is normally a
// real request bug, so it only counts here when the body names a billing or quota cause.
export function isProviderUnavailable(status, bodyText) {
  if ([401, 402, 403, 429].includes(status) || status >= 500) return true;
  if (status === 400) return /credit balance|billing|quota|insufficient/i.test(String(bodyText || ''));
  return false;
}

// The job still fails, deliberately: a quality gate that goes quiet during an outage is a gate
// failing open, and an exhausted balance also means the live assistant is down and Mike needs to
// know. What changes is legibility. GitHub Actions treats every non-zero exit as a failure, so the
// distinct code 78 is diagnostic only; the ::error annotation is the part that reaches the
// notification email and the run summary.
export function exitProviderUnavailable(status, bodyText, jobName) {
  const reason = status === 400 || status === 402
    ? 'the Anthropic credit balance is exhausted'
    : status === 401 || status === 403
      ? 'the ANTHROPIC_API_KEY secret was rejected'
      : status === 429
        ? 'the Anthropic API is rate limiting this account'
        : `the Anthropic API returned ${status}`;
  console.log(
    `::error title=AI auditor unavailable::${jobName} did not run because ${reason}. ` +
    'This is not a finding about the code. Check the credit balance at ' +
    'https://billing.anthropic.com/ (Console > Settings > Billing, Admin or Billing role), ' +
    'or the ANTHROPIC_API_KEY secret, then re-run this workflow.'
  );
  console.error(`Upstream detail (${status}):`, String(bodyText || '').slice(0, 500));
  process.exit(78);
}
