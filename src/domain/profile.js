export const EMPTY_PROFILE = Object.freeze({
  id: 'empty',
  label: 'No information yet',
  age: null,
  region: null,
  city: null,
  citizenship: null,
  educationStatus: null,       // 'incoming-college' | 'enrolled-college' | 'senior-high' | 'out-of-school' | 'graduate'
  academicStanding: null,      // 'high' | 'average'
  employmentStatus: null,      // 'none' | 'informal' | 'employed' | 'self-employed' | 'ofw'
  householdIncomeBracket: null,// 'low' | 'middle' | 'high'
  isPWD: null,
  isSoloParent: null,
  isIndigenous: null,
  has4Ps: null,
  philHealthMember: null,
  verifiedAttributes: null,
});

const ALLOWED = new Set(Object.keys(EMPTY_PROFILE));

export function createProfile(overrides = {}) {
  for (const key of Object.keys(overrides)) {
    if (!ALLOWED.has(key)) {
      throw new Error(`Unknown profile attribute: ${key}`);
    }
  }
  return { ...EMPTY_PROFILE, ...overrides };
}

export const PERSONAS = Object.freeze([
  Object.freeze(createProfile({
    id: 'mika', label: 'Mika, 18 — incoming freshman',
    age: 18, region: 'NCR', city: 'San Juan City', citizenship: 'PH',
    educationStatus: 'incoming-college', academicStanding: 'high',
    employmentStatus: 'none', isPWD: false,
  })),
  Object.freeze(createProfile({
    id: 'ramon', label: 'Ramon, 45 — informal worker',
    age: 45, region: 'NCR', city: 'Caloocan City', citizenship: 'PH',
    educationStatus: 'graduate', employmentStatus: 'informal',
    householdIncomeBracket: 'low', isPWD: false, philHealthMember: false,
  })),
  Object.freeze(createProfile({
    id: 'liza', label: 'Liza, 32 — solo parent',
    age: 32, region: 'Region IV-A', city: 'Cavite City', citizenship: 'PH',
    educationStatus: 'graduate', employmentStatus: 'employed',
    householdIncomeBracket: 'low', isSoloParent: true, has4Ps: true,
  })),
  Object.freeze({ ...EMPTY_PROFILE }),
]);

export function getPersona(id) {
  return PERSONAS.find((persona) => persona.id === id);
}
