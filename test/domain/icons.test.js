import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../../src/domain/catalog/index.js';
import { ICONS } from '../../src/components/icons.js';

const MAPPED = new Set(Object.keys(ICONS));

test('every catalog icon name has a mapping', () => {
  for (const entry of CATALOG) {
    assert.ok(MAPPED.has(entry.icon), `unmapped programme icon: ${entry.icon}`);
    for (const step of entry.journey.steps) {
      assert.ok(MAPPED.has(step.icon), `unmapped step icon: ${step.icon}`);
    }
  }
});
