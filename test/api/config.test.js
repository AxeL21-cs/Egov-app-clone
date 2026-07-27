import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPABILITIES, capabilityStatus, capabilityConfig } from '../../api/_lib/config.js';

const FULL_ENV = {
  EGOV_AI_API_BASE_URL: 'https://ai.test',
  EGOV_AI_ACCESS_CODE: 'code',
};

test('registry covers all eight services', () => {
  assert.deepEqual(Object.keys(CAPABILITIES).sort(), [
    'compass', 'egovAi', 'egovpay', 'emessage',
    'ereport', 'everify', 'faceLiveness', 'sso',
  ]);
});

test('live when base URL and all credentials are present', () => {
  assert.equal(capabilityStatus(FULL_ENV, 'egovAi'), 'live');
});

test('unconfigured when the base URL is missing', () => {
  assert.equal(capabilityStatus({ EGOV_AI_ACCESS_CODE: 'code' }, 'egovAi'), 'unconfigured');
});

test('unconfigured when a credential is missing', () => {
  assert.equal(capabilityStatus({ EGOV_AI_API_BASE_URL: 'https://ai.test' }, 'egovAi'), 'unconfigured');
});

test('unconfigured when a value is blank or whitespace', () => {
  assert.equal(capabilityStatus({ ...FULL_ENV, EGOV_AI_ACCESS_CODE: '   ' }, 'egovAi'), 'unconfigured');
});

test('capabilityConfig strips a trailing slash from the base URL', () => {
  const config = capabilityConfig({ ...FULL_ENV, EGOV_AI_API_BASE_URL: 'https://ai.test/' }, 'egovAi');
  assert.equal(config.baseUrl, 'https://ai.test');
  assert.equal(config.creds.EGOV_AI_ACCESS_CODE, 'code');
});

test('capabilityConfig throws 503 when unconfigured', () => {
  assert.throws(() => capabilityConfig({}, 'egovAi'), (error) => error.status === 503);
});

test('an unknown capability name throws', () => {
  assert.throws(() => capabilityStatus(FULL_ENV, 'nope'));
});
