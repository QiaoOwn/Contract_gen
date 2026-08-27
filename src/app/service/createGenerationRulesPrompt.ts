import {createHash} from 'crypto';
import generationRules from './prompts/generationRules.json';

type GenerationRule = Readonly<{id: string; text: string}>;
type GenerationRuleSection = Readonly<{
  heading: string;
  rules: readonly GenerationRule[];
}>;

const catalog = generationRules as Readonly<{
  version: string;
  sections: readonly GenerationRuleSection[];
}>;

export const OCL_GENERATION_RULES_VERSION = catalog.version;

export const createGenerationRulesPrompt = () =>
  catalog.sections
    .map((section) =>
      [section.heading + ':', ...section.rules.map((rule) => `[${rule.id}] ${rule.text}`)].join(
        '\n'
      )
    )
    .join('\n');

export const getGenerationRulesMetadata = () => {
  const text = createGenerationRulesPrompt();
  return {
    version: OCL_GENERATION_RULES_VERSION,
    hash: createHash('sha256').update(text, 'utf8').digest('hex'),
  } as const;
};

export const getGenerationRuleCatalog = () => catalog;
