import fs from 'fs-extra';
import path from 'path';
import * as allProjects from '@/rm2pt/project';
import {formatStructuredRequirement, getBenchmarkRequirement} from '@/rm2pt/benchmarkRequirements';
import type {UseCaseKeys} from '@/app/type';

const normalizeWords = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const unique = <T>(values: T[]) => [...new Set(values)];

const extractNumbers = (value: string) =>
  unique(
    [...value.matchAll(/(?<![A-Za-z0-9_])\d+(?:\.\d+)?(?![A-Za-z0-9_])/g)].map((match) => match[0])
  );

const extractEnumLiterals = (value: string) =>
  unique([...value.matchAll(/\b[A-Za-z_]\w*::([A-Za-z_]\w*)/g)].map((match) => match[1]));

const extractAssignedFeatures = (value: string) =>
  unique(
    [...value.matchAll(/\b[A-Za-z_]\w*\.([A-Za-z_]\w*)(?:@pre)?\s*=\s*(?!=)/g)].map(
      (match) => match[1]
    )
  );

const extractCollectionEffectFeatures = (value: string) =>
  unique(
    [...value.matchAll(/\b[A-Za-z_]\w*\.([A-Za-z_]\w*)->(?:includes|excludes)\s*\(/g)].map(
      (match) => match[1]
    )
  );

const extractRepositoryEffectTypes = (value: string) =>
  unique(
    [...value.matchAll(/\b([A-Z][A-Za-z_]\w*)\.allInstances\(\)->(?:includes|excludes)\s*\(/g)].map(
      (match) => match[1]
    )
  );

const isMentioned = (requirement: string, symbol: string) => {
  const requirementWords = normalizeWords(requirement);
  const symbolWords = normalizeWords(symbol);
  return requirementWords.includes(symbolWords);
};

const main = async () => {
  const rows: Record<string, unknown>[] = [];
  for (const [projectName, projectModule] of Object.entries(allProjects)) {
    const project = projectName as keyof typeof allProjects;
    for (const [useCaseName, useCaseObject] of Object.entries(projectModule.useCase)) {
      const useCase = useCaseName as UseCaseKeys;
      const service = useCaseObject.relatedService;
      for (const operation of service.operations) {
        const requirement = formatStructuredRequirement(
          getBenchmarkRequirement(project, String(useCase), operation.name)
        );
        const referenceContract = [
          operation.definition || '',
          operation.precondition || '',
          operation.postcondition || '',
        ].join('\n');
        const numbers = extractNumbers(referenceContract);
        const enumLiterals = extractEnumLiterals(referenceContract);
        const assignedFeatures = extractAssignedFeatures(operation.postcondition || '');
        const missingNumbers = numbers.filter(
          (value) =>
            Number(value) > 1 &&
            !new RegExp(`(?<![A-Za-z0-9_])${value.replace('.', '\\.')}(?![A-Za-z0-9_])`).test(
              requirement
            )
        );
        const missingEnums = enumLiterals.filter((value) => !isMentioned(requirement, value));
        const unmentionedAssignedFeatures = assignedFeatures.filter(
          (value) => !isMentioned(requirement, value)
        );
        const conditionalCount = (referenceContract.match(/\bif\b/g) || []).length;
        const suspiciousTemporalPredicates = unique(
          [
            ...(operation.postcondition || '').matchAll(
              /\b[A-Za-z_]\w*\.[A-Za-z_]\w*\.isEqual\((?:Today|Now)\)/g
            ),
          ].map((match) => match[0])
        );
        const requirementConditionalCount = (requirement.match(/\b(?:if|when|otherwise)\b/gi) || [])
          .length;
        const oracleId = [project, service.name, operation.name].join('-');
        const oraclePath = path.resolve(process.cwd(), 'test', oracleId, 'index.test.ts');
        const oraclePresent = await fs.pathExists(oraclePath);
        const oracleSource = oraclePresent ? await fs.readFile(oraclePath, 'utf8') : '';
        const unobservedAssignedFeatures = assignedFeatures.filter(
          (value) => !new RegExp(`\\b${value}\\b`).test(oracleSource)
        );
        const unobservedCollectionEffects = extractCollectionEffectFeatures(
          operation.postcondition || ''
        ).filter((value) => !new RegExp(`\\b${value}\\b`).test(oracleSource));
        const unobservedRepositoryEffects = extractRepositoryEffectTypes(
          operation.postcondition || ''
        ).filter(
          (value) => !new RegExp(`getRepository\\s*\\(\\s*${value}\\s*\\)`).test(oracleSource)
        );
        const strictProblems = [
          ...missingNumbers.map((value) => `requirement omits numeric threshold ${value}`),
          ...missingEnums.map((value) => `requirement omits enum literal ${value}`),
          ...suspiciousTemporalPredicates.map(
            (value) => `post-state time effect is written as a predicate: ${value}`
          ),
          ...unobservedAssignedFeatures.map(
            (value) => `oracle does not observe assigned feature ${value}`
          ),
          ...unobservedCollectionEffects.map(
            (value) => `oracle does not observe collection effect ${value}`
          ),
          ...unobservedRepositoryEffects.map(
            (value) => `oracle does not observe repository effect ${value}`
          ),
          ...(oraclePresent ? [] : ['operation-level oracle is missing']),
        ];
        rows.push({
          id: [project, useCase, operation.name].join('_'),
          project,
          useCase,
          service: service.name,
          operation: operation.name,
          requirement,
          reference: {
            definition: operation.definition || null,
            precondition: operation.precondition,
            postcondition: operation.postcondition,
          },
          audit: {
            missingNumbers,
            missingEnums,
            unmentionedAssignedFeatures,
            conditionalCount,
            requirementConditionalCount,
            suspiciousTemporalPredicates,
            unobservedAssignedFeatures,
            unobservedCollectionEffects,
            unobservedRepositoryEffects,
            strictProblems,
            riskScore:
              missingNumbers.length * 2 +
              missingEnums.length * 2 +
              unmentionedAssignedFeatures.length +
              Math.max(0, conditionalCount - requirementConditionalCount) +
              suspiciousTemporalPredicates.length * 3,
          },
          oraclePath: path.relative(process.cwd(), oraclePath),
          oraclePresent,
        });
      }
    }
  }

  rows.sort(
    (left, right) =>
      Number((right.audit as {riskScore: number}).riskScore) -
      Number((left.audit as {riskScore: number}).riskScore)
  );
  const outPath = path.resolve(process.cwd(), 'results', 'benchmark_semantic_coverage_audit.json');
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeJson(outPath, rows, {spaces: 2});
  const strictFailures = rows.filter(
    ({audit}) => (audit as {strictProblems: string[]}).strictProblems.length > 0
  );
  console.log(
    `Audited ${rows.length} operations; strict failures: ${strictFailures.length}; report: ${outPath}`
  );
  if (strictFailures.length) {
    console.error(
      JSON.stringify(
        strictFailures.map(({id, audit}) => ({
          id,
          problems: (audit as {strictProblems: string[]}).strictProblems,
        })),
        null,
        2
      )
    );
    process.exitCode = 1;
  }
};

void main();
