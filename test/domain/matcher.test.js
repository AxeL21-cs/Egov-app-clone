import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRule, evaluateEntry, matchPrograms, notEligible, topGaps } from '../../src/domain/matcher.js';
import { createProfile, getPersona, EMPTY_PROFILE } from '../../src/domain/profile.js';
import { CATALOG } from '../../src/domain/catalog/index.js';

const NOW = new Date('2026-07-28T00:00:00Z');

const entry = (gate, rules) => ({
  id: 'test-entry', domain: 'test', title: 'T', agency: 'A', type: 'T',
  gate, rules, window: { status: 'open' }, source: 'https://a.test',
  sourceLabel: 'A', verifiedOn: '2026-07-27', verification: 'verified', icon: 'x',
  journey: { id: 'j', steps: [] },
});

const pass = { id: 'p', label: 'Passes', kind: 'hard', test: () => true };
const fail = { id: 'f', label: 'Fails', kind: 'hard', test: () => false };
const unsure = { id: 'u', label: 'Unknown', kind: 'hard', test: () => 'unknown' };
const softPass = { id: 's', label: 'Soft passes', kind: 'soft', test: () => true };
const softFail = { id: 'sf', label: 'Soft fails', kind: 'soft', test: () => false };

test('evaluateRule returns the three states verbatim', () => {
  assert.equal(evaluateRule(pass, EMPTY_PROFILE), true);
  assert.equal(evaluateRule(fail, EMPTY_PROFILE), false);
  assert.equal(evaluateRule(unsure, EMPTY_PROFILE), 'unknown');
});

test('a failed hard rule produces not-eligible with a blocker', () => {
  const result = evaluateEntry(entry('automatic', [pass, fail]), EMPTY_PROFILE);
  assert.equal(result.tier, 'not-eligible');
  assert.deepEqual(result.blockers.map((b) => b.id), ['f']);
});

test('an unknown hard rule produces needs-info with a gap', () => {
  const result = evaluateEntry(entry('automatic', [pass, unsure]), EMPTY_PROFILE);
  assert.equal(result.tier, 'needs-info');
  assert.deepEqual(result.gaps.map((g) => g.id), ['u']);
});

test('a failed hard rule outranks an unknown one', () => {
  const result = evaluateEntry(entry('automatic', [unsure, fail]), EMPTY_PROFILE);
  assert.equal(result.tier, 'not-eligible');
});

test('an automatic gate with all hard rules passing is possible', () => {
  assert.equal(evaluateEntry(entry('automatic', [pass]), EMPTY_PROFILE).tier, 'possible');
});

test('a competitive gate is worth-checking, never possible', () => {
  assert.equal(evaluateEntry(entry('competitive', [pass]), EMPTY_PROFILE).tier, 'worth-checking');
});

test('an assessment gate is worth-checking', () => {
  assert.equal(evaluateEntry(entry('assessment', [pass]), EMPTY_PROFILE).tier, 'worth-checking');
});

test('a soft rule never disqualifies', () => {
  assert.equal(evaluateEntry(entry('automatic', [pass, softFail]), EMPTY_PROFILE).tier, 'possible');
});

test('passing soft rules are listed as reasons', () => {
  const result = evaluateEntry(entry('automatic', [pass, softPass]), EMPTY_PROFILE);
  assert.deepEqual(result.reasons.map((r) => r.id).sort(), ['p', 's']);
});

test('an unknown soft rule becomes a gap without changing the tier', () => {
  const soft = { id: 'su', label: 'Soft unknown', kind: 'soft', test: () => 'unknown' };
  const result = evaluateEntry(entry('automatic', [pass, soft]), EMPTY_PROFILE);
  assert.equal(result.tier, 'possible');
  assert.deepEqual(result.gaps.map((g) => g.id), ['su']);
});

test('the result never contains an approval field or a score', () => {
  const result = evaluateEntry(entry('automatic', [pass]), EMPTY_PROFILE);
  assert.equal('eligible' in result, false);
  assert.equal('score' in result, false);
  assert.equal(result.funding, null);
});

test('a rule with a missing kind fails closed and can block', () => {
  const noKind = { id: 'nk', label: 'No kind', test: () => false };
  const result = evaluateEntry(entry('automatic', [pass, noKind]), EMPTY_PROFILE);
  assert.equal(result.tier, 'not-eligible');
  assert.deepEqual(result.blockers.map((b) => b.id), ['nk']);
});

test('a rule with a mistyped kind (e.g. "Hard") fails closed and can block', () => {
  const typoKind = { id: 'tk', label: 'Typo kind', kind: 'Hard', test: () => false };
  const result = evaluateEntry(entry('automatic', [pass, typoKind]), EMPTY_PROFILE);
  assert.equal(result.tier, 'not-eligible');
  assert.deepEqual(result.blockers.map((b) => b.id), ['tk']);
});

test('the source link is always carried into the result', () => {
  const result = evaluateEntry(entry('automatic', [pass]), EMPTY_PROFILE);
  assert.equal(result.source, 'https://a.test');
  assert.equal(result.sourceLabel, 'A');
});

test('the empty profile yields needs-info everywhere and no blockers', () => {
  const all = [
    ...matchPrograms({ profile: EMPTY_PROFILE, catalog: CATALOG, now: NOW }),
    ...notEligible({ profile: EMPTY_PROFILE, catalog: CATALOG }),
  ];
  assert.equal(all.length, CATALOG.length);
  for (const match of all) {
    assert.equal(match.tier, 'needs-info');
    assert.deepEqual(match.blockers, []);
  }
});

test('Mika matches the merit scholarship but never above worth-checking', () => {
  const matches = matchPrograms({ profile: getPersona('mika'), catalog: CATALOG, now: NOW });
  const bpms = matches.find((match) => match.programId === 'ched-bpms');
  assert.equal(bpms.tier, 'worth-checking');
  assert.deepEqual(bpms.reasons.map((r) => r.id).sort(), ['is-filipino', 'is-incoming-freshman', 'strong-record']);
});

test('matchPrograms excludes not-eligible entries', () => {
  const ramon = getPersona('ramon');
  const matches = matchPrograms({ profile: ramon, catalog: CATALOG, now: NOW });
  assert.equal(matches.some((match) => match.tier === 'not-eligible'), false);
  assert.ok(notEligible({ profile: ramon, catalog: CATALOG }).length > 0);
});

test('open windows rank above closed ones at the same tier', () => {
  const catalog = [
    { ...entry('automatic', [pass]), id: 'closed', window: { status: 'closed' } },
    { ...entry('automatic', [pass]), id: 'open', window: { status: 'open' } },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });
  assert.equal(matches[0].programId, 'open');
});

test('possible ranks above worth-checking', () => {
  const catalog = [
    { ...entry('competitive', [pass]), id: 'contest' },
    { ...entry('automatic', [pass]), id: 'auto' },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });
  assert.equal(matches[0].programId, 'auto');
});

test('ranking interleaves domains so one domain cannot fill the top', () => {
  const catalog = [
    { ...entry('automatic', [pass]), id: 'e1', domain: 'education' },
    { ...entry('automatic', [pass]), id: 'e2', domain: 'education' },
    { ...entry('automatic', [pass]), id: 'h1', domain: 'health' },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });
  assert.equal(matches[1].domain, 'health');
});

test('tier precedence beats domain interleaving (discriminating regression fixture)', () => {
  // Regression for a bug where interleaveDomains round-robinned across the WHOLE
  // ranked list, so a 'worth-checking' programme from a second domain could land
  // above a 'possible' programme purely because of domain balancing.
  //
  // This exact fixture matters: with two health entries in the queue (one possible,
  // one worth-checking), the buggy round-robin drains the first health item before
  // ever reaching the second, so a worth-checking item can coincidentally still land
  // last even with the bug present — giving false confidence. With exactly ONE health
  // entry (worth-checking) competing against two education entries (possible), the
  // pre-fix code pulls that single health item up to position 1 (right after the
  // first education item), which is provably wrong. Verified by hand: reverting to
  // the pre-fix interleaveDomains against this fixture produces
  // ['A1', 'B1', 'A2'] and fails the assertion below; the fixed code produces
  // ['A1', 'A2', 'B1'].
  const catalog = [
    { ...entry('automatic', [pass]), id: 'A1', domain: 'education' },
    { ...entry('automatic', [pass]), id: 'A2', domain: 'education' },
    { ...entry('competitive', [pass]), id: 'B1', domain: 'health' },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });

  const possibleIndexes = matches
    .map((m, i) => [m, i])
    .filter(([m]) => m.tier === 'possible')
    .map(([, i]) => i);
  const worthCheckingIndexes = matches
    .map((m, i) => [m, i])
    .filter(([m]) => m.tier === 'worth-checking')
    .map(([, i]) => i);

  assert.deepEqual(possibleIndexes, [0, 1]);
  assert.deepEqual(worthCheckingIndexes, [2]);
  assert.ok(
    Math.max(...possibleIndexes) < Math.min(...worthCheckingIndexes),
    'every possible entry must precede every worth-checking entry',
  );
});

test('domains still interleave within a single tier (separate fixture)', () => {
  // Distinct fixture from the discriminating test above, which by design puts only
  // one domain in the possible tier (so it cannot also prove within-tier interleave).
  // This uses three same-tier entries across two domains, matching the pattern of
  // 'ranking interleaves domains so one domain cannot fill the top' above.
  const catalog = [
    { ...entry('automatic', [pass]), id: 'e1', domain: 'education' },
    { ...entry('automatic', [pass]), id: 'e2', domain: 'education' },
    { ...entry('automatic', [pass]), id: 'h1', domain: 'health' },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });
  assert.ok(matches.every((m) => m.tier === 'possible'));
  assert.equal(matches[1].domain, 'health');
});

test('topGaps ranks unknowns by how many programmes they unlock', () => {
  const shared = { id: 'income', label: 'Household income', kind: 'hard', test: () => 'unknown' };
  const lone = { id: 'age', label: 'Age', kind: 'hard', test: () => 'unknown' };
  const catalog = [
    { ...entry('automatic', [shared]), id: 'a' },
    { ...entry('automatic', [shared]), id: 'b' },
    { ...entry('automatic', [lone]), id: 'c' },
  ];
  const gaps = topGaps(matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW }));
  assert.equal(gaps[0].id, 'income');
  assert.equal(gaps[0].unlocks, 2);
});

test('Liza (solo parent, has4Ps) is not-eligible for the two student-only programs and needs-info for AICS', () => {
  // Liza is a 32-year-old graduate who is currently employed — she is neither an incoming
  // freshman nor an enrolled student, so BPMS and TES correctly rule her out (both require
  // student status, which is a hard rule). AICS only requires *a* student in the household,
  // not that Liza herself be one — but her persona never sets `hasStudentInHousehold`, so that
  // hard rule is genuinely unknown rather than true or false, landing her at needs-info instead
  // of guessing possible/worth-checking or wrongly disqualifying her.
  const liza = getPersona('liza');
  const matches = matchPrograms({ profile: liza, catalog: CATALOG, now: NOW });
  const notEligibleMatches = notEligible({ profile: liza, catalog: CATALOG });

  assert.deepEqual(matches.map((m) => m.programId), ['dswd-aics']);
  assert.equal(matches[0].tier, 'needs-info');
  assert.deepEqual(matches[0].gaps.map((g) => g.id), ['has-student-in-household']);

  assert.deepEqual(notEligibleMatches.map((m) => m.programId).sort(), ['ched-bpms', 'ched-tes']);
  for (const match of notEligibleMatches) assert.equal(match.tier, 'not-eligible');
});

test('matching is deterministic for a fixed now', () => {
  const profile = createProfile({ citizenship: 'PH', educationStatus: 'incoming-college' });
  const first = matchPrograms({ profile, catalog: CATALOG, now: NOW });
  const second = matchPrograms({ profile, catalog: CATALOG, now: NOW });
  assert.deepEqual(first.map((m) => m.programId), second.map((m) => m.programId));
});
