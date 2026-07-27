import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveJourney, journeyProgress } from '../../src/domain/journey.js';

const STEPS = [
  { id: 'a', title: 'Profile', dependsOn: [] },
  { id: 'b', title: 'Birth certificate', dependsOn: ['a'] },
  { id: 'c', title: 'School record', dependsOn: ['b'] },
  { id: 'x', title: 'PWD ID', dependsOn: [], conditional: 'claims-pwd' },
];

const byId = (steps) => Object.fromEntries(steps.map((step) => [step.id, step]));

test('a step with satisfied dependencies is available', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: ['a'] }));
  assert.equal(steps.a.status, 'complete');
  assert.equal(steps.b.status, 'available');
});

test('a step with unmet dependencies is locked and names the blocker', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: [] }));
  assert.equal(steps.c.status, 'locked');
  assert.equal(steps.c.lockedBy, 'Birth certificate');
});

test('conditional steps are never locked', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: [] }));
  assert.equal(steps.x.status, 'conditional');
});

test('a completed conditional step reads as complete', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: ['x'] }));
  assert.equal(steps.x.status, 'complete');
});

test('processing unlocks dependants but is not complete', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: ['a'], processing: ['b'] }));
  assert.equal(steps.b.status, 'processing');
  assert.equal(steps.c.status, 'available');
});

test('the first step of an empty journey is available', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: [] }));
  assert.equal(steps.a.status, 'available');
});

test('progress ignores conditional steps', () => {
  const resolved = resolveJourney({ steps: STEPS, completed: ['a'] });
  const progress = journeyProgress(resolved);
  assert.equal(progress.total, 3);
  assert.equal(progress.done, 1);
  assert.equal(progress.percent, 33);
});

test('progress counts processing as done', () => {
  const resolved = resolveJourney({ steps: STEPS, completed: ['a'], processing: ['b'] });
  assert.equal(journeyProgress(resolved).done, 2);
});

test('an empty journey reports zero percent without dividing by zero', () => {
  assert.deepEqual(journeyProgress([]), { done: 0, total: 0, percent: 0 });
});

test('a missing dependency id does not crash and locks the step', () => {
  const steps = byId(resolveJourney({ steps: [{ id: 'q', title: 'Q', dependsOn: ['ghost'] }], completed: [] }));
  assert.equal(steps.q.status, 'locked');
});
