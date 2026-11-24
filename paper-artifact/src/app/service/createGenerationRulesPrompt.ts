import {createHash} from 'crypto';
import generationRulesV5 from './prompts/generationRules.v5.json';
import {
  getActiveStudyGenerationProfile,
  type StudyGenerationProfileId,
  resolveStudyGenerationProfileId,
} from './studyGenerationProfile';

type GenerationRule = Readonly<{id: string; text: string}>;
type GenerationRuleSection = Readonly<{
  heading: string;
  rules: readonly GenerationRule[];
}>;
type GenerationRuleCatalog = Readonly<{
  version: string;
  sections: readonly GenerationRuleSection[];
}>;

const catalog: GenerationRuleCatalog = generationRulesV5 as GenerationRuleCatalog;

const renderCatalog = (catalog: GenerationRuleCatalog) =>
  catalog.sections
    .map((section) =>
      [section.heading + ':', ...section.rules.map((rule) => `[${rule.id}] ${rule.text}`)].join(
        '\n'
      )
    )
    .join('\n');

export const getGenerationRuleCatalog = (
  _profileId: StudyGenerationProfileId = resolveStudyGenerationProfileId()
) => {
  if (catalog.version !== 'ocl-generation-rules-v5') {
    throw new Error(
      `Generation rules file version ${catalog.version} does not match the frozen dialect profile`
    );
  }
  void _profileId;
  return catalog;
};

export const OCL_GENERATION_RULES_VERSION =
  getActiveStudyGenerationProfile().generationRulesVersion;

export const createGenerationRulesPrompt = (
  profileId: StudyGenerationProfileId = resolveStudyGenerationProfileId()
) => renderCatalog(getGenerationRuleCatalog(profileId));

export const getGenerationRulesMetadata = (
  profileId: StudyGenerationProfileId = resolveStudyGenerationProfileId()
) => {
  const catalog = getGenerationRuleCatalog(profileId);
  const text = renderCatalog(catalog);
  return {
    version: catalog.version,
    hash: createHash('sha256').update(text, 'utf8').digest('hex'),
  } as const;
};
