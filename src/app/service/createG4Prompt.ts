import fs from 'fs-extra';
import path from 'path';
import {createHash} from 'crypto';

export const OCL_GENERATION_GRAMMAR_VERSION = 'ocl-generation-grammar-v2';

const readGenerationGrammar = () =>
  fs
    .readFileSync(
      path.resolve(process.cwd(), 'src/app/service/prompts/generationGrammar.txt'),
      'utf8'
    )
    .trim();

// The argument is retained so tests can compare generation guidance with the
// parser source. Generation receives only the executable contract projection,
// never the unrelated use-case, workflow, or entity-declaration grammar.
export const createGenerationGrammar = (_remodelG4?: string) => {
  void _remodelG4;
  return readGenerationGrammar();
};

export const getGenerationGrammarMetadata = () => {
  const text = createGenerationGrammar();
  return {
    version: OCL_GENERATION_GRAMMAR_VERSION,
    hash: createHash('sha256').update(text, 'utf8').digest('hex'),
  } as const;
};

export const createG4Prompt = () =>
  [
    'Generate only the definition, precondition, and postcondition fields of one executable REMODEL operation contract.',
    'In a postcondition, "=" on attributes, associations, service state, or result denotes an update obligation; never write chained equalities such as result = a = b.',
    'Generate only constructs admitted by this executable operation-contract generation subset:',
    createGenerationGrammar(),
  ].join('\n');
