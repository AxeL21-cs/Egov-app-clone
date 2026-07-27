import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_PROFILE, PERSONAS, createProfile, getPersona } from '../../src/domain/profile.js';

test('every attribute in the empty profile is unknown', () => {
  for (const [key, value] of Object.entries(EMPTY_PROFILE)) {
    if (key === 'id' || key === 'label') continue;
    assert.equal(value, null, `${key} should default to null`);
  }
});

test('createProfile merges overrides onto the empty profile', () => {
  const profile = createProfile({ age: 18, educationStatus: 'incoming-college' });
  assert.equal(profile.age, 18);
  assert.equal(profile.educationStatus, 'incoming-college');
  assert.equal(profile.householdIncomeBracket, null);
});

test('createProfile rejects unknown attributes', () => {
  assert.throws(() => createProfile({ favouriteColour: 'blue' }), /favouriteColour/);
});

test('ships at least four personas including an empty one', () => {
  assert.ok(PERSONAS.length >= 4);
  assert.ok(PERSONAS.some((persona) => persona.id === 'empty'));
});

test('every persona has a unique id and a label', () => {
  const ids = PERSONAS.map((persona) => persona.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const persona of PERSONAS) assert.equal(typeof persona.label, 'string');
});

test('getPersona finds Mika', () => {
  const mika = getPersona('mika');
  assert.equal(mika.age, 18);
  assert.equal(mika.educationStatus, 'incoming-college');
});

test('getPersona returns undefined for an unknown id', () => {
  assert.equal(getPersona('nobody'), undefined);
});

test('mutating a persona throws and does not change the value', () => {
  const mika = getPersona('mika');
  assert.throws(() => {
    mika.age = 19;
  }, TypeError);
  assert.equal(getPersona('mika').age, 18);
});

test('createProfile returns a mutable object despite EMPTY_PROFILE being frozen', () => {
  const profile = createProfile({ age: 25 });
  profile.age = 26;
  assert.equal(profile.age, 26);
});
