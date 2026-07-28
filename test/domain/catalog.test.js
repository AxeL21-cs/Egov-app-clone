import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, DOMAINS, getEntry, validateEntry } from '../../src/domain/catalog/index.js';

const VALID = {
  id: 'x', domain: 'health', title: 'X', agency: 'A', type: 'T',
  gate: 'automatic', rules: [{ id: 'r', label: 'R', kind: 'hard', test: () => true }],
  window: { status: 'open' }, source: 'https://a.test', sourceLabel: 'A',
  verifiedOn: '2026-07-27', verification: 'verified', icon: 'x',
  journey: { id: 'xj', steps: [{ id: 's', title: 'S', dependsOn: [] }] },
};

test('the shipped catalog is valid', () => {
  assert.ok(CATALOG.length >= 3);
  for (const entry of CATALOG) assert.deepEqual(validateEntry(entry), []);
});

test('getEntry finds a programme by id', () => {
  assert.equal(getEntry('ched-bpms').agency, 'CHED');
});

test('DOMAINS lists unique domains', () => {
  assert.ok(DOMAINS.includes('education'));
  assert.equal(new Set(DOMAINS).size, DOMAINS.length);
});

test('a missing source is reported', () => {
  const problems = validateEntry({ ...VALID, source: undefined });
  assert.ok(problems.some((problem) => problem.includes('source')));
});

test('a missing verifiedOn is reported', () => {
  assert.ok(validateEntry({ ...VALID, verifiedOn: undefined }).some((p) => p.includes('verifiedOn')));
});

test('an invalid gate is reported', () => {
  assert.ok(validateEntry({ ...VALID, gate: 'magic' }).some((p) => p.includes('gate')));
});

test('an invalid verification value is reported', () => {
  assert.ok(validateEntry({ ...VALID, verification: 'maybe' }).some((p) => p.includes('verification')));
});

test('a rule without a label is reported', () => {
  const broken = { ...VALID, rules: [{ id: 'r', kind: 'hard', test: () => true }] };
  assert.ok(validateEntry(broken).some((p) => p.includes('label')));
});

test('a rule whose test is not a function is reported', () => {
  const broken = { ...VALID, rules: [{ id: 'r', label: 'R', kind: 'hard', test: 'yes' }] };
  assert.ok(validateEntry(broken).some((p) => p.includes('test')));
});

test('a dependsOn pointing at a missing step is reported', () => {
  const broken = { ...VALID, journey: { id: 'j', steps: [{ id: 's', title: 'S', dependsOn: ['ghost'] }] } };
  assert.ok(validateEntry(broken).some((p) => p.includes('ghost')));
});

test('a valid entry produces no problems', () => {
  assert.deepEqual(validateEntry(VALID), []);
});

test('rules as a non-array truthy value returns problems, never throws', () => {
  const broken = { ...VALID, rules: {} };
  const problems = validateEntry(broken);
  assert.ok(Array.isArray(problems));
  assert.ok(problems.some((p) => p.includes('rules') && p.includes('array')));
});

test('journey.steps as a non-array truthy value returns problems, never throws', () => {
  const broken = { ...VALID, journey: { id: 'j', steps: {} } };
  const problems = validateEntry(broken);
  assert.ok(Array.isArray(problems));
  assert.ok(problems.some((p) => p.includes('steps') && p.includes('array')));
});

test('validateEntry(null) returns problems, never throws', () => {
  const problems = validateEntry(null);
  assert.ok(Array.isArray(problems));
  assert.ok(problems.length > 0);
});

test('validateEntry(undefined) returns problems, never throws', () => {
  const problems = validateEntry(undefined);
  assert.ok(Array.isArray(problems));
  assert.ok(problems.length > 0);
});

test('a rule missing an id is reported', () => {
  const broken = { ...VALID, rules: [{ label: 'R', kind: 'hard', test: () => true }] };
  assert.ok(validateEntry(broken).some((p) => p.includes('id')));
});

test('a rule with a missing or mistyped kind is reported', () => {
  const missingKind = { ...VALID, rules: [{ id: 'r', label: 'R', test: () => true }] };
  assert.ok(validateEntry(missingKind).some((p) => p.includes('kind')));

  const typoKind = { ...VALID, rules: [{ id: 'r', label: 'R', kind: 'Hard', test: () => true }] };
  assert.ok(validateEntry(typoKind).some((p) => p.includes('kind')));
});

test('an invalid window.status value is reported', () => {
  const broken = { ...VALID, window: { status: 'invalid' } };
  const problems = validateEntry(broken);
  assert.ok(problems.some((p) => p.includes('status')));
});

test('a verifiedOn value not in YYYY-MM-DD format is reported', () => {
  const broken = { ...VALID, verifiedOn: 'banana' };
  const problems = validateEntry(broken);
  assert.ok(problems.some((p) => p.includes('verifiedOn')));
});

test('duplicate step ids within a journey are reported', () => {
  const broken = {
    ...VALID,
    journey: {
      id: 'j',
      steps: [
        { id: 's', title: 'S1', dependsOn: [] },
        { id: 's', title: 'S2', dependsOn: [] },
      ],
    },
  };
  const problems = validateEntry(broken);
  assert.ok(problems.some((p) => p.includes('duplicate') && p.includes('step')));
});

test('tightened: missing source mentions exactly "missing source"', () => {
  const problems = validateEntry({ ...VALID, source: undefined });
  assert.ok(problems.some((p) => p === 'x: missing source'));
});

test('tightened: missing sourceLabel mentions exactly "missing sourceLabel"', () => {
  const problems = validateEntry({ ...VALID, sourceLabel: undefined });
  assert.ok(problems.some((p) => p === 'x: missing sourceLabel'));
});

test('a valid entry with window.status "closed" passes', () => {
  const entry = { ...VALID, window: { status: 'closed' } };
  assert.deepEqual(validateEntry(entry), []);
});

test('a valid entry with window.status "rolling" passes', () => {
  const entry = { ...VALID, window: { status: 'rolling' } };
  assert.deepEqual(validateEntry(entry), []);
});

test('a valid entry with window.status "after-enrollment" passes', () => {
  const entry = { ...VALID, window: { status: 'after-enrollment' } };
  assert.deepEqual(validateEntry(entry), []);
});
