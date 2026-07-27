export function resolveJourney({ steps = [], completed = [], processing = [] } = {}) {
  const doneSet = new Set(completed);
  const processingSet = new Set(processing);
  const titles = new Map(steps.map((step) => [step.id, step.title]));

  const satisfied = (id) => doneSet.has(id) || processingSet.has(id);

  return steps.map((step) => {
    const dependsOn = step.dependsOn || [];

    if (doneSet.has(step.id)) return { ...step, status: 'complete', lockedBy: '' };
    if (processingSet.has(step.id)) return { ...step, status: 'processing', lockedBy: '' };
    if (step.conditional) return { ...step, status: 'conditional', lockedBy: '' };

    const unmet = dependsOn.find((id) => !satisfied(id));
    if (unmet) {
      return { ...step, status: 'locked', lockedBy: titles.get(unmet) || 'an earlier step' };
    }

    return { ...step, status: 'available', lockedBy: '' };
  });
}

export function journeyProgress(resolvedSteps = []) {
  const core = resolvedSteps.filter((step) => step.status !== 'conditional');
  const done = core.filter((step) => step.status === 'complete' || step.status === 'processing').length;
  const total = core.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
