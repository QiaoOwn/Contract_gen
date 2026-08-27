class PreconditionError extends Error {
  constructor(message: string) {
    super(`Precondition validation failed:  ${message}`);
    this.name = 'PreconditionError';
  }
}

const evaluateDefinition = <T>(evaluation: () => T): T => {
  try {
    return evaluation();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new PreconditionError(`definition binding could not be evaluated: ${detail}`);
  }
};

export {evaluateDefinition, PreconditionError};
