/** The current runtime has one generation profile for the OCLTSVM dialect. */
import versionRegistry from '../../../config/study-versions.json';

export type StudyGenerationProfileId = 'contractgen-rm2pt-v4';

const ACTIVE_PROFILE = versionRegistry.studies['contractgen-rm2pt-v4'];

export const STUDY_GENERATION_PROFILES = {
  'contractgen-rm2pt-v4': {
    id: 'contractgen-rm2pt-v4' as const,
    promptVersion: ACTIVE_PROFILE.components.prompt.version,
    expectedPromptHash: ACTIVE_PROFILE.components.prompt.sha256,
    generationGrammarVersion: ACTIVE_PROFILE.components.generation_grammar.version,
    expectedGenerationGrammarHash: ACTIVE_PROFILE.components.generation_grammar.sha256,
    generationRulesVersion: ACTIVE_PROFILE.components.generation_rules.version,
    expectedGenerationRulesHash: ACTIVE_PROFILE.components.generation_rules.sha256,
    role: 'Current RM2PT v4 preparation and OCLTSVM-dialect generation',
  },
} as const;

const ENV_KEY = 'CONTRACTGEN_STUDY_GENERATION_PROFILE';
export const DEFAULT_STUDY_GENERATION_PROFILE =
  versionRegistry.default_generation_profile as StudyGenerationProfileId;

export const resolveStudyGenerationProfileId = (
  raw: string | undefined = process.env[ENV_KEY]
): StudyGenerationProfileId => {
  const value = raw?.trim();
  if (!value || value === DEFAULT_STUDY_GENERATION_PROFILE) {
    return DEFAULT_STUDY_GENERATION_PROFILE;
  }
  throw new Error(
    `${ENV_KEY} must be ${DEFAULT_STUDY_GENERATION_PROFILE}; historical generation profiles are not active in this checkout, got ${JSON.stringify(raw)}`
  );
};

export const getActiveStudyGenerationProfile = () =>
  STUDY_GENERATION_PROFILES[resolveStudyGenerationProfileId()];
