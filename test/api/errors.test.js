import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, publicError } from '../../api/_lib/errors.js';

test('ApiError carries status and details', () => {
  const error = new ApiError('bad uuid', 400, { field: 'uuid' });
  assert.equal(error.message, 'bad uuid');
  assert.equal(error.status, 400);
  assert.deepEqual(error.details, { field: 'uuid' });
});

test('publicError passes through 4xx messages', () => {
  const result = publicError(new ApiError('A valid UUID is required.', 400));
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'A valid UUID is required.');
});

test('publicError hides 5xx internals', () => {
  const result = publicError(new ApiError('ECONNREFUSED 10.0.0.5:5432', 500));
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'An internal error occurred.');
});

test('publicError defaults unknown errors to 500 and hides the message', () => {
  const result = publicError(new Error('secret stack detail'));
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'An internal error occurred.');
});

test('publicError clamps out-of-range status codes', () => {
  const result = publicError(new ApiError('weird', 999));
  assert.equal(result.status, 500);
});
