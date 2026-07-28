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

// egovAi has exactly one credential, so creds.every(...) and creds.some(...) behave
// identically against it and a regression from `every` to `some` would slip through every
// egovAi assertion above undetected. `sso` has two credentials (EGOV_SSO_PARTNER_CODE and
// EGOV_SSO_PARTNER_SECRET), so this is the discriminating case: with only one of the two
// present, `every` correctly reports 'unconfigured' while a buggy `some' would wrongly
// report 'live'.
test('unconfigured when only one of two required credentials is present (sso)', () => {
  assert.equal(capabilityStatus({
    EGOV_SSO_API_BASE_URL: 'https://sso.test',
    EGOV_SSO_PARTNER_CODE: 'partner-code',
  }, 'sso'), 'unconfigured');
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
