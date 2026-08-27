import {createHash} from 'crypto';
import {createCommonContractErrorPrompt} from './createCommonContractErrorPrompt';
import {createDefinitionPrompt} from './createDefinitionPrompt';
import {createG4Prompt, getGenerationGrammarMetadata} from './createG4Prompt';
import {
  createGenerationRulesPrompt,
  getGenerationRulesMetadata,
} from './createGenerationRulesPrompt';
import {createOCLGenerationConfiguration} from './generationConfiguration';

export const OCL_GENERATION_PROMPT_VERSION = 'contractgen-system-prompt-v7';

export const createOCLGenerationSystemPrompt = () => {
  const text = [
    'You are the OCL Generator in Contract Gen. Translate one structured natural-language operation requirement into an executable REMODEL OCL contract.',
    'The caller supplies operation metadata, the structured requirement, model context, and read-only environment values. Preserve the stated semantics and remain grounded in those declarations.',
    [
      'Requirement-to-field mapping:',
      '- Preconditions bullets go only into precondition.',
      '- Operation intent and Postconditions bullets go into postcondition.',
      '- Reusable query helpers go into definition; otherwise set definition to JSON null.',
    ].join('\n'),
    createG4Prompt(),
    createDefinitionPrompt(),
    'OCL generation rule catalog:',
    createGenerationRulesPrompt(),
    'Return exactly one JSON object with keys definition, precondition, and postcondition.',
    'Use JSON null for definition when no helper binding is required. The other two values must be expression strings.',
    'Do not return a Contract wrapper, Markdown, comments, explanations, or additional keys.',
    createCommonContractErrorPrompt(),
  ]
    .filter(Boolean)
    .join('\n\n');
  return {
    text,
    version: OCL_GENERATION_PROMPT_VERSION,
    hash: createHash('sha256').update(text, 'utf8').digest('hex'),
    generationConfig: createOCLGenerationConfiguration(),
    components: {
      grammar: getGenerationGrammarMetadata(),
      generationRules: getGenerationRulesMetadata(),
    },
  } as const;
};
