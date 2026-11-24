class PostconditionError extends Error {
  constructor(message: string) {
    super(`Postcondition validation failed: ${message}`);
    this.name = 'PostconditionError';
  }
}

export {PostconditionError};
