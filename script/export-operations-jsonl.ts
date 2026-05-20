/**
 * Writes data/operations.jsonl — one JSON object per operation in rm2pt/project,
 * aligned with script/experiment.ts iteration order and RQ1 script fields.
 */
import fs from 'fs-extra';
import path from 'path';
import * as allProjects from '@/rm2pt/project';
import {createProjectContextPrompt} from '@/app/service/createProjectContextPrompt';
import type {UseCaseKeys} from '@/app/type';

const CASE_STUDY_LABEL: Record<keyof typeof allProjects, string> = {
  Airport: 'Airport',
  AutomatedTellerMachine: 'ATM',
  CoCoME: 'CoCoME',
  LibraryManagementSystem: 'Library Management',
  LoanProcessingSystem: 'Loan Processing',
};

const outPath = path.resolve(process.cwd(), 'data', 'operations.jsonl');

const main = async () => {
  const lines: string[] = [];
  for (const [p, mod] of Object.entries(allProjects)) {
    const project = p as keyof typeof allProjects;
    const {useCase} = mod;
    for (const [uc, ucObj] of Object.entries(useCase)) {
      const useCase = uc as UseCaseKeys;
      const {relatedService} = ucObj as {
        relatedService: {
          name: string;
          operations: {
            name: string;
            description: string;
            parameters?: {name: string; type: string}[];
            returnType?: {type: string};
          }[];
        };
      };
      const modelContext = createProjectContextPrompt({project, useCase});
      for (const op of relatedService.operations) {
        const params = (op.parameters ?? []).map((e) => ({name: e.name, type: e.type}));
        const paramSig = params.map((e) => `${e.name}: ${e.type}`).join(', ');
        const ret = op.returnType?.type ?? 'void';
        const id = `${project}_${useCase}_${op.name}`.replace(/\s+/g, '_');
        const row = {
          id,
          case_study: CASE_STUDY_LABEL[project],
          project,
          useCase,
          operation: op.name,
          service: relatedService.name,
          entity: relatedService.name,
          operation_name: op.name,
          operation_signature: `${op.name}(${paramSig}): ${ret}`,
          description: op.description?.trim() ?? '',
          parameters: params,
          return_type: ret,
          model_context: modelContext,
          reference_contract: '',
        };
        lines.push(JSON.stringify(row));
      }
    }
  }
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${lines.length} operations to ${outPath}`);
};

void main();
