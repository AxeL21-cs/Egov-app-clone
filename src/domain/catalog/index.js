import education from './education.js';

const GATES = new Set(['automatic', 'competitive', 'assessment']);
const VERIFICATIONS = new Set(['verified', 'unverified']);
const WINDOW_STATUSES = new Set(['open', 'closed', 'rolling', 'after-enrollment']);
const REQUIRED = ['id', 'domain', 'title', 'agency', 'type', 'source', 'sourceLabel', 'verifiedOn', 'icon'];
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export function validateEntry(entry) {
  const problems = [];

  // Use consistent fallback for all messages
  const entryId = entry?.id || 'entry';

  for (const field of REQUIRED) {
    if (!entry?.[field]) problems.push(`${entryId}: missing ${field}`);
  }

  if (!GATES.has(entry?.gate)) problems.push(`${entryId}: invalid gate "${entry?.gate}"`);
  if (!VERIFICATIONS.has(entry?.verification)) problems.push(`${entryId}: invalid verification "${entry?.verification}"`);
  if (!entry?.window?.status) problems.push(`${entryId}: missing window.status`);
  if (entry?.window?.status && !WINDOW_STATUSES.has(entry.window.status)) {
    problems.push(`${entryId}: invalid window.status "${entry.window.status}"`);
  }

  if (entry?.verifiedOn && !DATE_FORMAT.test(entry.verifiedOn)) {
    problems.push(`${entryId}: verifiedOn must be in YYYY-MM-DD format, got "${entry.verifiedOn}"`);
  }

  // Guard rules with Array.isArray check
  if (!Array.isArray(entry?.rules)) {
    if (entry?.rules !== undefined && entry?.rules !== null) {
      problems.push(`${entryId}: rules must be an array`);
    }
  } else {
    for (const rule of entry.rules) {
      if (!rule.id) problems.push(`${entryId}: rule missing id`);
      if (!rule.label) problems.push(`${entryId}: rule ${rule.id || '(no id)'} missing label`);
      if (typeof rule.test !== 'function') problems.push(`${entryId}: rule ${rule.id || '(no id)'} test must be a function`);
      if (rule.kind !== 'hard' && rule.kind !== 'soft') {
        problems.push(`${entryId}: rule ${rule.id || '(no id)'} has invalid kind "${rule.kind}"`);
      }
    }
  }

  // Guard journey.steps with Array.isArray check
  let steps = [];
  if (!entry?.journey) {
    // journey is optional, no problem
  } else if (!Array.isArray(entry.journey.steps)) {
    if (entry.journey.steps !== undefined && entry.journey.steps !== null) {
      problems.push(`${entryId}: journey.steps must be an array`);
    }
  } else {
    steps = entry.journey.steps;
  }

  // Check for duplicate step ids within this entry's journey
  const stepIds = new Set();
  for (const step of steps) {
    if (stepIds.has(step.id)) {
      problems.push(`${entryId}: duplicate step id "${step.id}"`);
    }
    stepIds.add(step.id);
  }

  // Check for missing dependencies
  for (const step of steps) {
    for (const dependency of step.dependsOn || []) {
      if (!stepIds.has(dependency)) problems.push(`${entryId}: step ${step.id} depends on unknown step ${dependency}`);
    }
  }

  return problems;
}

export const CATALOG = [...education];

const allProblems = CATALOG.flatMap(validateEntry);

// Check for duplicate entry ids across the catalog
const seenIds = new Set();
for (const entry of CATALOG) {
  if (seenIds.has(entry.id)) {
    allProblems.push(`duplicate entry id "${entry.id}" appears more than once in catalog`);
  }
  seenIds.add(entry.id);
}

if (allProblems.length > 0) {
  throw new Error(`Invalid catalog entries:\n${allProblems.join('\n')}`);
}

export const DOMAINS = [...new Set(CATALOG.map((entry) => entry.domain))].sort();

export function getEntry(id) {
  return CATALOG.find((entry) => entry.id === id);
}
