class PreconditionError extends Error {
  oclOrigin?: {clause: 'definition'; binding: string};
  constructor(message: string) {
    super(`Precondition validation failed:  ${message}`);
    this.name = 'PreconditionError';
  }
}

const evaluateDefinition = <T>(evaluation: () => T, binding?: string): T => {
  try {
    return evaluation();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const failure = new PreconditionError(`definition binding could not be evaluated: ${detail}`);
    if(binding)failure.oclOrigin={clause:'definition',binding};
    throw failure;
  }
};

/** Preserve the exception type while recording which executable phase failed. */
const evaluateEffect = <T>(evaluation: () => T): T => {
  try { return evaluation(); }
  catch(error){
    if(error instanceof Error&&Object.isExtensible(error)){
      try{Object.defineProperty(error,'oclOrigin',{value:{clause:'postcondition',phase:'effect'},configurable:true});}catch{/* Metadata must not replace the original failure. */}
    }
    throw error;
  }
};

const evaluatePrecondition = <T>(evaluation: () => T): T => {
  try { return evaluation(); }
  catch(error){
    if(error instanceof Error&&Object.isExtensible(error)){
      try{Object.defineProperty(error,'oclOrigin',{value:{clause:'precondition',phase:'admission'},configurable:true});}catch{}
    }
    throw error;
  }
};

export {evaluateDefinition, evaluateEffect, evaluatePrecondition, PreconditionError};
