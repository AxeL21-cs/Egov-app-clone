const TIER_ORDER = { possible: 0, 'worth-checking': 1, 'needs-info': 2, 'not-eligible': 3 };
// Tiers that can appear in matchPrograms' output, in ranking order. 'not-eligible' is
// filtered out before this is used, so it is intentionally omitted.
const RANKED_TIERS = ['possible', 'worth-checking', 'needs-info'];
// 'after-enrollment' is deliberately NOT open: a programme that only becomes actionable
// once you've already enrolled is not something a citizen can act on right now, so it
// ties for ranking with 'closed' rather than with 'open'/'rolling'. Do not "fix" this.
const OPEN_WINDOWS = new Set(['open', 'rolling']);

export function evaluateRule(rule, profile) {
  const outcome = rule.test(profile);
  return outcome === true || outcome === false ? outcome : 'unknown';
}

function tierFor(gate) {
  return gate === 'automatic' ? 'possible' : 'worth-checking';
}

export function evaluateEntry(entry, profile) {
  const reasons = [];
  const gaps = [];
  const blockers = [];
  let hardGaps = false;

  for (const rule of entry.rules || []) {
    const outcome = evaluateRule(rule, profile);
    const summary = { id: rule.id, label: rule.label };
    // Fail closed: only a rule explicitly marked 'soft' is soft. A missing or
    // mistyped kind (e.g. 'Hard') is treated as hard so it can still block or
    // gate the tier, rather than silently vanishing from the evaluation.
    const isHard = rule.kind !== 'soft';

    if (outcome === true) {
      reasons.push(summary);
    } else if (outcome === 'unknown') {
      gaps.push(summary);
      if (isHard) hardGaps = true;
    } else if (isHard) {
      blockers.push(summary);
    }
  }

  let tier;
  if (blockers.length > 0) tier = 'not-eligible';
  else if (hardGaps) tier = 'needs-info';
  else tier = tierFor(entry.gate);

  return {
    programId: entry.id,
    domain: entry.domain,
    tier,
    reasons,
    gaps,
    blockers,
    window: entry.window,
    source: entry.source,
    sourceLabel: entry.sourceLabel,
    verification: entry.verification,
    funding: null,
  };
}

function rank(a, b) {
  const byTier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
  if (byTier !== 0) return byTier;

  const openness = Number(OPEN_WINDOWS.has(b.window?.status)) - Number(OPEN_WINDOWS.has(a.window?.status));
  if (openness !== 0) return openness;

  const byReasons = b.reasons.length - a.reasons.length;
  if (byReasons !== 0) return byReasons;

  return a.programId.localeCompare(b.programId, 'en');
}

function interleaveDomains(matches) {
  const buckets = new Map();
  for (const match of matches) {
    if (!buckets.has(match.domain)) buckets.set(match.domain, []);
    buckets.get(match.domain).push(match);
  }

  const queues = [...buckets.values()];
  const output = [];
  while (output.length < matches.length) {
    for (const queue of queues) {
      if (queue.length > 0) output.push(queue.shift());
    }
  }
  return output;
}

export function matchPrograms({ profile, catalog, now }) {
  if (!now) throw new Error('matchPrograms requires an explicit `now`.');
  // `now` is required but not yet read anywhere below. It is threaded through so that
  // window/deadline logic can become date-driven later without changing every call site.

  const matches = catalog
    .map((entry) => evaluateEntry(entry, profile))
    .filter((match) => match.tier !== 'not-eligible')
    .sort(rank);

  // Tier precedence must never be broken by domain balancing: partition by tier FIRST,
  // then interleave domains WITHIN each tier, then concatenate tiers in order. Domain
  // round-robin only decides ordering among peers of equal confidence.
  return RANKED_TIERS
    .map((tier) => matches.filter((match) => match.tier === tier))
    .flatMap((partition) => interleaveDomains(partition));
}

export function notEligible({ profile, catalog }) {
  return catalog
    .map((entry) => evaluateEntry(entry, profile))
    .filter((match) => match.tier === 'not-eligible');
}

export function topGaps(matches) {
  const counts = new Map();
  for (const match of matches) {
    for (const gap of match.gaps) {
      const current = counts.get(gap.id) || { id: gap.id, label: gap.label, unlocks: 0 };
      current.unlocks += 1;
      counts.set(gap.id, current);
    }
  }
  return [...counts.values()].sort((a, b) => b.unlocks - a.unlocks || a.id.localeCompare(b.id));
}
