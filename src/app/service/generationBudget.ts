export const DEFAULT_MAX_GENERATION_ATTEMPTS = 5;

export const validateGenerationMode = (
  graphMode: 'feedback' | 'linear' | 'paired',
  feedbackMode: 'full' | 'generic' | 'none',
  hasInitialCandidate = false
) => {
  const valid =
    (graphMode === 'linear' && feedbackMode === 'none') ||
    (graphMode === 'feedback' && feedbackMode !== 'none') ||
    (graphMode === 'paired' && hasInitialCandidate);
  if (!valid) {
    throw new Error(
      `Inconsistent generation mode: graphMode=${graphMode}, feedbackMode=${feedbackMode}. ` +
        'Use linear/none, feedback/generic, feedback/full, or paired with a frozen initial candidate.'
    );
  }
};

export const normalizeGenerationBudget = (value?: number) => {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_GENERATION_ATTEMPTS;
  }
  return Math.min(DEFAULT_MAX_GENERATION_ATTEMPTS, Math.max(1, Math.floor(value as number)));
};

export const canRetryGeneration = (
  generationCount: number | undefined,
  maxGenerationAttempts: number | undefined
) => (generationCount || 0) < normalizeGenerationBudget(maxGenerationAttempts);

export const routeGenerationEntry = (hasInitialCandidate: boolean) =>
  hasInitialCandidate ? ('seeded' as const) : ('generate' as const);

export const routeAfterValidation = (
  hasErrors: boolean,
  generationCount: number | undefined,
  maxGenerationAttempts: number | undefined
) => {
  if (!hasErrors) {
    return 'next' as const;
  }
  return canRetryGeneration(generationCount, maxGenerationAttempts)
    ? ('retry' as const)
    : ('exhausted' as const);
};
