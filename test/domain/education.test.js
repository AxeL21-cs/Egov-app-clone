import { test } from 'node:test';
import assert from 'node:assert/strict';
import education from '../../src/domain/catalog/education.js';
import { CATALOG } from '../../src/domain/catalog/index.js';

test('carries the three education programmes', () => {
  assert.deepEqual(education.map((entry) => entry.id).sort(), ['ched-bpms', 'ched-tes', 'dswd-aics']);
});

test('every entry is in the education domain', () => {
  for (const entry of education) assert.equal(entry.domain, 'education');
});

test('AICS is gated on assessment, never automatic', () => {
  const aics = education.find((entry) => entry.id === 'dswd-aics');
  assert.equal(aics.gate, 'assessment');
  assert.equal(aics.type, 'Crisis assistance');
});

test('AICS requires a student in the household as a hard rule', () => {
  const aics = education.find((entry) => entry.id === 'dswd-aics');
  const rule = aics.rules.find((r) => r.id === 'has-student-in-household');
  assert.ok(rule, 'expected dswd-aics to carry a has-student-in-household rule');
  assert.equal(rule.kind, 'hard');
  assert.equal(rule.test({ hasStudentInHousehold: null }), 'unknown');
  assert.equal(rule.test({ hasStudentInHousehold: true }), true);
  assert.equal(rule.test({ hasStudentInHousehold: false }), false);
});

test('the merit scholarship is competitive and its call is closed', () => {
  const bpms = education.find((entry) => entry.id === 'ched-bpms');
  assert.equal(bpms.gate, 'competitive');
  assert.equal(bpms.window.status, 'closed');
});

test('the merit scholarship does not invent a next-opens date', () => {
  const bpms = education.find((entry) => entry.id === 'ched-bpms');
  assert.equal(bpms.window.nextOpens, null);
  assert.equal(bpms.window.note, 'AY 2026–2027 call closed; next call not yet announced');
});

test('TES is school-mediated, not automatic', () => {
  const tes = education.find((entry) => entry.id === 'ched-tes');
  assert.equal(tes.gate, 'assessment');
  assert.equal(tes.window.note, 'School-mediated; coordinate with your HEI after enrollment');
});

test('icons are strings, never component references', () => {
  for (const entry of education) {
    assert.equal(typeof entry.icon, 'string');
    for (const step of entry.journey.steps) assert.equal(typeof step.icon, 'string');
  }
});

test('the BPMS journey chain is declared, not implied by order', () => {
  const bpms = education.find((entry) => entry.id === 'ched-bpms');
  const steps = Object.fromEntries(bpms.journey.steps.map((step) => [step.id, step]));
  assert.deepEqual(steps['bpms-birth'].dependsOn, []);
  assert.deepEqual(steps['bpms-sf9'].dependsOn, ['bpms-birth']);
  assert.deepEqual(steps['bpms-admission'].dependsOn, ['bpms-sf9']);
  assert.deepEqual(steps['bpms-income'].dependsOn, ['bpms-admission']);
});

test('the TES journey chain is declared, not implied by order', () => {
  const tes = education.find((entry) => entry.id === 'ched-tes');
  const steps = Object.fromEntries(tes.journey.steps.map((step) => [step.id, step]));
  assert.deepEqual(steps['tes-profile'].dependsOn, []);
  assert.deepEqual(steps['tes-enrollment'].dependsOn, ['tes-profile']);
  assert.deepEqual(steps['tes-residency'].dependsOn, []);
  assert.deepEqual(steps['tes-pwd'].dependsOn, []);
});

test('the AICS journey chain is declared, not implied by order', () => {
  const aics = education.find((entry) => entry.id === 'dswd-aics');
  const steps = Object.fromEntries(aics.journey.steps.map((step) => [step.id, step]));
  assert.deepEqual(steps['aics-profile'].dependsOn, []);
  assert.deepEqual(steps['aics-school'].dependsOn, ['aics-profile']);
  assert.deepEqual(steps['aics-assessment'].dependsOn, ['aics-school']);
  assert.deepEqual(steps['aics-local'].dependsOn, []);
});

test('the income step offers four accepted alternatives', () => {
  const bpms = education.find((entry) => entry.id === 'ched-bpms');
  const income = bpms.journey.steps.find((step) => step.id === 'bpms-income');
  assert.equal(income.method, 'choice');
  assert.equal(income.options.length, 4);
});

// Recursively walks every string field reachable from `value` (objects and
// arrays included; functions such as rule.test are skipped since they are
// not text a citizen ever reads) and invokes `visit(str, path)` for each,
// so a violation can be reported with the exact field path that caused it.
function walkStrings(value, path, visit) {
  if (typeof value === 'string') {
    visit(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, `${path}[${index}]`, visit));
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) {
      walkStrings(val, path ? `${path}.${key}` : key, visit);
    }
  }
}

test('no entry uses approval language anywhere in its text', () => {
  const banned = /\b(qualified|approved|guaranteed|entitled|eligible)\b/i;
  // Iterates the full catalog (not just the education module) so every present and future
  // domain is covered by this, the only automated enforcement of the calibrated-language rule.
  for (const entry of CATALOG) {
    walkStrings(entry, entry.id, (str, path) => {
      assert.equal(banned.test(str), false, `banned approval-language word found at ${path}: "${str}"`);
    });
  }
});
