import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import type {ModelIndex} from '../src/app/service/modelIndex';
import {
  MODEL_GROUNDING_RULES_VERSION,
  MODEL_RULE_FAMILIES,
  createModelGroundingRules,
  createModelGroundingPreview,
  renderModelGroundingRules,
} from '../src/app/service/modelGroundingRules';
import {createOCLGenerationSystemPrompt} from '../src/app/service/createOCLGenerationSystemPrompt';
import {buildOperationInput} from '../src/app/service/createOperationInput';
import {runModelIndexAudit} from './audit_model_index';

const digest = (content: string | Buffer) => createHash('sha256').update(content).digest('hex');
const readRows = (file: string) =>
  fs
    .readFileSync(file, 'utf8')
    .trimEnd()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

export const exportModelGroundingRules = (input: string, output: string) => {
  const root = process.cwd();
  const outputDir = path.resolve(output);
  if (
    !['results', 'tmp'].some((folder) => outputDir.startsWith(path.join(root, folder) + path.sep))
  ) {
    throw new Error('Rule export must be a subdirectory of results or tmp');
  }
  const inputText = fs.readFileSync(input, 'utf8');
  const audit = runModelIndexAudit(input, path.join(outputDir, 'index-audit'));
  if (audit.consistentOperations !== 114)
    throw new Error('Resolve the model-index audit before exporting constraints');
  const indexes = readRows(path.join(outputDir, 'index-audit/model_indexes.jsonl')) as ModelIndex[];
  const rows = readRows(input);
  const systemPrompt = createOCLGenerationSystemPrompt();
  const packs = indexes.map(createModelGroundingRules);
  const previews = packs.map((pack, position) => {
    const row = rows[position];
    if (
      row.id !== `${pack.project}_${pack.useCase}_${pack.operation}` ||
      row.prompt_hash !== systemPrompt.hash ||
      row.prompt_version !== systemPrompt.version ||
      row.generation_rules_hash !== systemPrompt.components.generationRules.hash ||
      row.generation_grammar_hash !== systemPrompt.components.grammar.hash
    ) {
      throw new Error(`Base input/profile mismatch for rule export: ${row.id}`);
    }
    const base = buildOperationInput({
      project: row.project,
      useCase: row.useCase,
      operation: row.operation_name,
      userInput: row.description,
      modelGrounding: false,
    });
    const preview = createModelGroundingPreview(base.content, pack);
    if (
      row.input_hash !==
        (row.model_grounding_enabled ? preview.inputHash : preview.baseInputHash) ||
      digest(row.canonical_user_message) !== row.input_hash ||
      (row.model_grounding_enabled && row.model_grounding_rules_hash !== pack.rulesHash)
    )
      throw new Error(`Base input hash mismatch: ${row.id}`);
    return {id: row.id, baseCharacters: base.content.length, ...preview};
  });
  const protectedFiles: {file: string; sha256: string}[] = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'index-audit/protected_files.json'), 'utf8')
  );
  if (
    protectedFiles.some(
      (file) => digest(fs.readFileSync(path.resolve(root, file.file))) !== file.sha256
    )
  ) {
    throw new Error('Protected generation/evaluation inputs changed during rule export');
  }
  const familyCounts = Object.fromEntries(
    MODEL_RULE_FAMILIES.map((family) => [
      family.id,
      packs.reduce(
        (count, pack) => count + pack.rules.filter((rule) => rule.family === family.id).length,
        0
      ),
    ])
  );
  const sizes = previews.map((preview, position) => ({
    id: preview.id,
    ruleCount: packs[position].rules.length,
    baseCharacters: preview.baseCharacters,
    addedRuleCharacters: preview.content.length - preview.baseCharacters,
    previewCharacters: preview.content.length,
  }));
  const summary = {
    ruleCatalogVersion: MODEL_GROUNDING_RULES_VERSION,
    ruleFamilies: MODEL_RULE_FAMILIES.length,
    operationCount: packs.length,
    familyCounts,
    totalRuleInstances: packs.reduce((count, pack) => count + pack.rules.length, 0),
    addedRuleCharacters: {
      minimum: Math.min(...sizes.map((item) => item.addedRuleCharacters)),
      maximum: Math.max(...sizes.map((item) => item.addedRuleCharacters)),
      mean: sizes.reduce((total, item) => total + item.addedRuleCharacters, 0) / sizes.length,
    },
    inputSha256: digest(inputText),
    baseSystemPromptVersion: systemPrompt.version,
    baseSystemPromptHash: systemPrompt.hash,
    rulePackFileSha256: digest(packs.map((pack) => JSON.stringify(pack)).join('\n') + '\n'),
    activeGenerationChanged: false,
    exportScope:
      'This export does not modify runtime configuration; the generation entry already enables the rules.',
    runtimeModelGroundingEnabledByDefault: true,
    manifestInputsWithRules: rows.filter((row) => row.model_grounding_enabled).length,
    previewOnly: true,
    dedicatedContractValidatorConnected: true,
    ruleGuidedStaticRepairConnected: true,
    referenceClausesUsed: false,
    jestScenariosUsed: false,
    llmCalls: 0,
    protectedFilesUnchanged: true,
    interpretation:
      'Counts are declaration-derived rule instances, not successful generation or repair outcomes. Character counts are not tokenizer measurements.',
  };
  const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
  fs.writeFileSync(
    path.join(outputDir, 'rule_packs.jsonl'),
    packs.map((pack) => JSON.stringify(pack)).join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(outputDir, 'input_previews.jsonl'),
    previews.map((preview) => JSON.stringify(preview)).join('\n') + '\n'
  );
  fs.writeFileSync(path.join(outputDir, 'family_catalog.json'), json(MODEL_RULE_FAMILIES));
  fs.writeFileSync(path.join(outputDir, 'preview_sizes.json'), json(sizes));
  fs.writeFileSync(path.join(outputDir, 'summary.json'), json(summary));
  const examples = [
    'LibraryManagementSystem_borrowBook_borrowBook',
    'AutomatedTellerMachine_manageBankCard_createBankCard',
  ];
  fs.mkdirSync(path.join(outputDir, 'examples'), {recursive: true});
  for (const id of examples) {
    const position = previews.findIndex((preview) => preview.id === id);
    if (position < 0) throw new Error(`Missing example operation: ${id}`);
    fs.writeFileSync(
      path.join(outputDir, 'examples', id + '.md'),
      [
        `# ${id}: Model-Derived Rules`,
        '',
        'Status: exported illustration of the runtime model-derived rules; this exporter makes no LLM calls.',
        `Base input hash: ${previews[position].baseInputHash}`,
        `Rules hash: ${packs[position].rulesHash}`,
        '',
        '```text',
        renderModelGroundingRules(packs[position]),
        '```',
        '',
      ].join('\n')
    );
  }
  fs.writeFileSync(
    path.join(outputDir, 'REPORT.md'),
    [
      '# Model-Derived Generation Rules',
      '',
      `- Operations: ${packs.length}; template families: ${MODEL_RULE_FAMILIES.length}.`,
      `- Derived rule instances across operation contexts: ${summary.totalRuleInstances}.`,
      '- The structural index audit passes for all 114 operations.',
      '- Each rule includes model element IDs and exact local declaration provenance.',
      '- Exported previews retain their preview schema; their content is built without duplicating the active input rule block.',
      `- Current manifest inputs with enabled rules: ${summary.manifestInputsWithRules}.`,
      '- Existing prompt/rules, benchmark, Oracle locks and project declarations are unchanged.',
      '- No LLM calls or new generation/repair outcomes are reported.',
      '',
      '## Rule Families',
      '',
      '| Family | Scope | Instances |',
      '| --- | --- | --- |',
      ...MODEL_RULE_FAMILIES.map(
        (family) => `| ${family.id} | ${family.name} | ${familyCounts[family.id]} |`
      ),
      '',
      '## Validation Status',
      '',
      'This exporter checks model consistency and dependencies. The runtime additionally checks generated OCL with the same rule pack and supplies model-grounded static repair guidance in full-feedback mode. Coverage and limits are documented in family_catalog.json.',
      '',
      'The input extension carries structural model facts. Requirement behavior remains in the existing NL requirements. Full UML multiplicity, business invariants, and inverse/cascade effects are not inferred.',
      '',
      'Read examples/ for compact paper-facing examples and rule_packs.jsonl for machine-readable facts and evidence. preview_sizes.json reports the input size added by the extension.',
      '',
    ].join('\n')
  );
  return summary;
};

if (require.main === module) {
  const {values} = parseArgs({
    options: {
      input: {
        type: 'string',
        default: 'data/benchmark/lab_adjudicated_114_v2/operations-lab-adjudicated-114-v2.jsonl',
      },
      'output-dir': {type: 'string', default: 'results/model-grounding-step2-v1'},
    },
  });
  process.stdout.write(
    JSON.stringify(exportModelGroundingRules(values.input!, values['output-dir']!), null, 2) + '\n'
  );
}
