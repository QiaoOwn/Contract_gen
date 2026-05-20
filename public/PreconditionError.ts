class PreconditionError extends Error {
  constructor(message: string) {
    super(`Precondition validation failed:  ${message}`);
    this.name = 'PreconditionError';
  }
}
export {PreconditionError};
