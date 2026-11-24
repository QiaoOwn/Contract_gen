globalThis.fetch = async () => { throw new Error('RQ2 replay forbids network calls'); };
require('./run-ocltsvm-result-mutant.ts');
