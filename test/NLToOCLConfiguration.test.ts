import fs from 'fs-extra';
import path from 'path';
import {createCommonContractErrorPrompt} from '@/app/service/createCommonContractErrorPrompt';
import {createGenerationGrammar} from '@/app/service/createG4Prompt';
import {
  createGenerationRulesPrompt,
  getGenerationRuleCatalog,
} from '@/app/service/createGenerationRulesPrompt';
import {createOCLGenerationSystemPrompt} from '@/app/service/createOCLGenerationSystemPrompt';
import {
  DEFAULT_MAX_GENERATION_ATTEMPTS,
  normalizeGenerationBudget,
  routeAfterValidation,
} from '@/app/service/generationBudget';

describe('NL-to-OCL generation configuration', () => {
  test('generation-facing guidance exposes only standard allInstances()', () => {
    const parserGrammar = fs.readFileSync(
      path.resolve(process.cwd(), 'antlr4/REMODEL.g4'),
      'utf-8'
    );
    const prompt = [
      createGenerationGrammar(parserGrammar),
      createGenerationRulesPrompt(),
      createCommonContractErrorPrompt(),
    ].join('\n');

    expect(prompt).toContain('allInstances()');
    expect(prompt).not.toContain('allInstance()');
  });

  test('the Contract Gen LLM configuration is explicit and frozen', () => {
    const prompt = createOCLGenerationSystemPrompt();

    expect(prompt.version).toBe('contractgen-system-prompt-v7');
    expect(prompt.text).toContain('Requirement-to-field mapping:');
    expect(prompt.text).toContain('[G-MAP-01]');
    expect(prompt.text).toContain('[G-SYN-06]');
    expect(prompt.text).toContain('[G-TMP-04]');
    expect(prompt.text).toContain('[G-SYN-09]');
    expect(prompt.text).toContain('[G-SEM-07]');
    expect(prompt.generationConfig).toMatchObject({
      version: 'llm-generation-config-v5',
      outputMode: 'json',
      temperature: 0.2,
      maxTokens: 4096,
      reasoningPolicy: {
        gpt5ReasoningEffort: 'none',
        gemini35FlashThinkingLevel: 'minimal',
        claudeOpus47Effort: 'low',
        qwen3CoderThinkingEnabled: false,
      },
    });
    expect(prompt.generationConfig.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(prompt.components).toMatchObject({
      grammar: {version: 'ocl-generation-grammar-v2'},
      generationRules: {version: 'ocl-generation-rules-v4'},
    });
    expect(prompt.components.grammar.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(prompt.components.generationRules.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('generation rule identifiers are unique and rendered into the prompt', () => {
    const catalog = getGenerationRuleCatalog();
    const rules = catalog.sections.flatMap((section) => section.rules);
    const ids = rules.map((rule) => rule.id);
    const prompt = createGenerationRulesPrompt();

    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(prompt).toContain(`[${id}]`));
  });

  test('the compact generation grammar is closed and excludes parser-only constructs', () => {
    const grammar = createGenerationGrammar();
    const withoutTerminals = grammar.replace(/"(?:[^"\\]|\\.)*"/g, '');
    const defined = new Set(
      [...withoutTerminals.matchAll(/^\s*([a-z][a-z-]*)\s*::=/gm)].map((match) => match[1])
    );
    const referenced = new Set(
      [...withoutTerminals.matchAll(/\b[a-z][a-z-]*\b/g)].map((match) => match[0])
    );

    defined.forEach((name) => referenced.delete(name));
    expect([...referenced]).toEqual([]);
    expect(grammar).not.toContain('operation-call');
    expect(grammar).not.toContain('allInstance()');
  });

  test('generation budget is clamped to one through five calls', () => {
    expect(normalizeGenerationBudget()).toBe(DEFAULT_MAX_GENERATION_ATTEMPTS);
    expect(normalizeGenerationBudget(0)).toBe(1);
    expect(normalizeGenerationBudget(3.9)).toBe(3);
    expect(normalizeGenerationBudget(99)).toBe(DEFAULT_MAX_GENERATION_ATTEMPTS);
  });

  test('validation retries stop when the generation budget is exhausted', () => {
    expect(routeAfterValidation(false, 5, 5)).toBe('next');
    expect(routeAfterValidation(true, 4, 5)).toBe('retry');
    expect(routeAfterValidation(true, 5, 5)).toBe('exhausted');
  });
});
