import {createHash} from 'crypto';
import {createCommonContractErrorPrompt} from './createCommonContractErrorPrompt';
import {createDefinitionPrompt} from './createDefinitionPrompt';
import {createG4Prompt, getGenerationGrammarMetadata} from './createG4Prompt';
import {
  createGenerationRulesPrompt,
  getGenerationRulesMetadata,
} from './createGenerationRulesPrompt';
import {createOCLGenerationConfiguration} from './generationConfiguration';
import {
  getActiveStudyGenerationProfile,
  resolveStudyGenerationProfileId,
  STUDY_GENERATION_PROFILES,
  type StudyGenerationProfileId,
} from './studyGenerationProfile';

/** Current OCLTSVM-dialect prompt version; historical study versions are metadata only. */
export const OCL_GENERATION_PROMPT_VERSION = getActiveStudyGenerationProfile().promptVersion;

export const createOCLGenerationSystemPrompt = (
  profileId: StudyGenerationProfileId = resolveStudyGenerationProfileId()
) => {
  const profile = STUDY_GENERATION_PROFILES[profileId];

  const text = [
    'You are the OCL Generator in Contract Gen. Translate one structured natural-language operation requirement into an executable REMODEL OCL contract.',
    'The caller supplies operation metadata, the structured requirement, model context, and read-only environment values. Preserve the stated semantics and remain grounded in those declarations.',
    [
      'Requirement-to-field mapping:',
      '- Preconditions bullets go only into precondition.',
      '- Operation intent and Postconditions bullets go into postcondition.',
      '- Reusable query helpers go into definition; otherwise set definition to JSON null.',
    ].join('\n'),
    createG4Prompt(profileId),
    createDefinitionPrompt(),
    'OCL generation rule catalog:',
    createGenerationRulesPrompt(profileId),
    'Return exactly one JSON object with keys definition, precondition, and postcondition.',
    'Use JSON null for definition when no helper binding is required. The other two values must be expression strings.',
    'Do not return a Contract wrapper, Markdown, comments, explanations, or additional keys.',
    createCommonContractErrorPrompt(),
  ]
    .filter(Boolean)
    .join('\n\n');
  const hash = createHash('sha256').update(text, 'utf8').digest('hex');
  const grammar = getGenerationGrammarMetadata(profileId);
  const rules = getGenerationRulesMetadata(profileId);
  if (profile.expectedPromptHash && hash !== profile.expectedPromptHash) {
    throw new Error(
      `${profileId} system prompt hash mismatch: got ${hash}, expected ${profile.expectedPromptHash}`
    );
  }
  if (profile.expectedGenerationRulesHash && rules.hash !== profile.expectedGenerationRulesHash) {
    throw new Error(
      `${profileId} generation-rules hash mismatch: got ${rules.hash}, expected ${profile.expectedGenerationRulesHash}`
    );
  }
  if (grammar.version !== profile.generationGrammarVersion || grammar.hash !== profile.expectedGenerationGrammarHash) {
    throw new Error(`${profileId} generation-grammar version or hash mismatch`);
  }

  return {
    text,
    version: profile.promptVersion,
    hash,
    generationConfig: createOCLGenerationConfiguration(),
    components: {
      grammar,
      generationRules: rules,
    },
    studyGenerationProfile: profileId,
  } as const;
};
