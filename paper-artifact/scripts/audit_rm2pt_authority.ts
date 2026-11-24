import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import * as projects from '../src/rm2pt/project';
import type {UseCase} from '../src/rm2pt/model/UseCase';
import {extractCommentedSourceContract, extractSourceContracts, normalizedSourceClause} from './rm2pt_source_contracts';
import policy from '../config/rm2pt-authority-policy.json';

const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
export function auditRm2ptAuthority(input: string, output: string) {
  if (fs.existsSync(output)) throw new Error('Use a new audit directory');
  const bytes = fs.readFileSync(input);
  const rows = bytes.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  if (rows.length !== 114 || new Set(rows.map(row => row.id)).size !== 114) throw new Error('Expected 114 unique operations');
  const upstream = JSON.parse(fs.readFileSync('data/operation_revision/upstream_rm2pt/manifest.json', 'utf8')) as {
    commit: string; files: {project: string; path: string; sha256: string}[];
  };
  const sources = upstream.files.map((file: {project: string; path: string; sha256: string}) => {
    const content = fs.readFileSync(file.path);
    const localHash = hash(content);
    const matches = localHash === file.sha256 || hash(content.toString('utf8').replaceAll('\r\n', '\n')) === file.sha256;
    if (!matches) throw new Error(`Source content differs from pinned RM2PT snapshot: ${file.path}`);
    return {...file, local_sha256: localHash,
      line_endings_only: localHash !== file.sha256,
      contracts: file.path.endsWith('.remodel') ? extractSourceContracts(content.toString('utf8')) : []};
  });
  const details = rows.map(row => {
    const model = projects[row.project as keyof typeof projects];
    const useCase = (model.useCase as Record<string, UseCase>)[row.useCase];
    const operation = useCase.relatedService.operations.find(item => item.name === row.operation_name)!;
    const candidates = sources.filter((file: {project: string}) => file.project === row.project)
      .flatMap((file: typeof sources[number]) => file.contracts.filter(contract => contract.service === row.service && contract.operation === row.operation_name)
        .map(contract => ({...contract, path: file.path, sha256: file.local_sha256})));
    const mapping = (policy.approved_source_mappings as Record<string, {
      decision_id: string; decision_file: string; source_service: string; source_operation: string;
    }>)[row.id];
    const mappedCandidates = mapping ? sources.filter(file => file.project === row.project)
      .flatMap(file => file.contracts.filter(contract => contract.service === mapping.source_service && contract.operation === mapping.source_operation)
        .map(contract => ({...contract, path: file.path, sha256: file.local_sha256}))) : [];
    if (mapping) {
      const decision = JSON.parse(fs.readFileSync(mapping.decision_file, 'utf8'));
      if (candidates.length || mappedCandidates.length !== 1 || decision.status !== 'APPROVED' ||
          decision.operation_id !== row.id || decision.decision_id !== mapping.decision_id ||
          decision.source_file !== mappedCandidates[0].path || decision.source_sha256 !== mappedCandidates[0].sha256 ||
          decision.mapping.project_service !== row.service || decision.mapping.source_service !== mapping.source_service ||
          decision.mapping.source_operation !== mapping.source_operation)
        throw new Error(`Approved source mapping does not match source evidence: ${row.id}`);
    }
    const source = mapping ? mappedCandidates[0] : candidates.length === 1 ? candidates[0] : null;
    const restoration = (policy.approved_restored_drafts as Record<string, {decision_id: string; decision_file: string}>)[row.id];
    const draft = restoration ? (() => {
      const decision = JSON.parse(fs.readFileSync(restoration.decision_file, 'utf8'));
      const file = sources.find(item => item.project === row.project && item.path === decision.source_file);
      if (candidates.length || mapping || !file || decision.status !== 'APPROVED' || decision.operation_id !== row.id ||
          decision.decision_id !== restoration.decision_id || decision.source_sha256 !== file.local_sha256 ||
          decision.source_kind !== 'LAB_APPROVED_RESTORED_COMMENTED_DRAFT' || decision.original_active_contract !== false ||
          decision.source_service !== row.service || decision.source_operation !== row.operation_name ||
          !Array.isArray(decision.source_lines) || decision.source_lines.length !== 2)
        throw new Error(`Restored draft approval does not match source evidence: ${row.id}`);
      const contract = extractCommentedSourceContract(fs.readFileSync(file.path, 'utf8'), decision.source_lines[0], decision.source_lines[1]);
      if (contract.service !== row.service || contract.operation !== row.operation_name)
        throw new Error(`Restored draft identity mismatch: ${row.id}`);
      return {...contract, path: file.path, sha256: file.local_sha256};
    })() : null;
    const compared = source ?? draft;
    const signatureDiffers = compared ? compared.parameters.length !== row.parameters.length ||
      compared.parameters.some((parameter, index) => parameter.name !== row.parameters[index]?.name ||
        normalizedSourceClause(parameter.type) !== normalizedSourceClause(row.parameters[index]?.type)) ||
      normalizedSourceClause(compared.returnType ?? '') !== normalizedSourceClause(row.return_type ?? '') : null;
    const clauseDifferences = compared ? (['definition', 'precondition', 'postcondition'] as const)
      .filter(clause => normalizedSourceClause(compared[clause]) !== normalizedSourceClause(operation[clause])) : [];
    if ((mapping || restoration) && (signatureDiffers || clauseDifferences.length))
      throw new Error(`Source alias or restored draft cannot silently change signature or business clauses: ${row.id}`);
    const activeStatus = draft ? 'LAB_APPROVED_RESTORED_DRAFT'
      : !source ? candidates.length ? 'AMBIGUOUS_SOURCE' : 'NO_ACTIVE_EXACT_SOURCE'
      : signatureDiffers ? 'SIGNATURE_DIFFERENCE' : clauseDifferences.length ? 'CLAUSE_DIFFERENCE_REQUIRES_FIDELITY_REVIEW' : 'CLAUSE_SHAPE_ALIGNED';
    return {id: row.id, project: row.project, useCase: row.useCase, operation: row.operation_name,
      service: row.service, status: activeStatus, signatureDiffers, clauseDifferences,
      sourceResolution: draft ? 'LAB_APPROVED_RESTORED_COMMENTED_DRAFT' : mapping ? 'USER_APPROVED_SERVICE_ALIAS' : source ? 'EXACT_ACTIVE_SOURCE' : 'UNRESOLVED',
      generationRequirement: row.description,
      projectCatalogClauses: {definition: operation.definition ?? '', precondition: operation.precondition ?? '', postcondition: operation.postcondition ?? ''},
      rm2ptSource: source,
      labApprovedDraft: draft,
      requirementFidelityStatus: 'REQUIRES_SOURCE_REVIEW_NOT_PROVEN_BY_TEXTUAL_COMPARISON',
      oracleAlignmentStatus: 'NOT_AUDITED_NO_JEST_EXECUTION',
    };
  });
  fs.mkdirSync(output, {recursive: true});
  const summary = {version: 'rm2pt-authority-audit-v1', input, input_sha256: hash(bytes),
    operation_count: rows.length, source_commit: upstream.commit,
    active_exact_source_count: details.filter(row => row.sourceResolution === 'EXACT_ACTIVE_SOURCE').length,
    approved_service_alias_count: details.filter(row => row.sourceResolution === 'USER_APPROVED_SERVICE_ALIAS').length,
    lab_approved_restored_draft_count: details.filter(row => row.labApprovedDraft).length,
    reconciled_source_operation_count: details.filter(row => row.rm2ptSource || row.labApprovedDraft).length,
    resolved_source_operation_count: details.filter(row => row.rm2ptSource).length,
    distinct_original_operation_count: new Set(details.filter(row => row.rm2ptSource).map(row =>
      `${row.rm2ptSource!.path}::${row.rm2ptSource!.service}::${row.rm2ptSource!.operation}`)).size,
    clause_shape_aligned_count: details.filter(row => row.status === 'CLAUSE_SHAPE_ALIGNED').length,
    signature_difference_count: details.filter(row => row.signatureDiffers).length,
    clause_difference_count: details.filter(row => row.clauseDifferences.length).length,
    no_active_exact_source_count: details.filter(row => row.sourceResolution !== 'EXACT_ACTIVE_SOURCE').length,
    unresolved_source_count: details.filter(row => !row.rm2ptSource && !row.labApprovedDraft).length,
    raw_upstream_modified: false, model_calls: 0, jest_executions: 0,
    scope: 'Only comments, whitespace, string quoting and singular/plural allInstance spelling are normalized for clause-shape comparison. This does not prove semantic or NL/oracle fidelity.'};
  fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'operation-audit.jsonl'), details.map(row => JSON.stringify(row)).join('\n') + '\n');
  fs.writeFileSync(path.join(output, 'source-files.json'), JSON.stringify(sources.map(({contracts, ...file}: typeof sources[number]) => file), null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}
if (require.main === module) {
  const {values} = parseArgs({options: {input: {type: 'string', default: 'data/benchmark/lab_adjudicated_114_v2/operations-lab-adjudicated-114-v2.jsonl'}, 'output-dir': {type: 'string'}}});
  if (!values['output-dir']) throw new Error('Specify --output-dir');
  auditRm2ptAuthority(values.input!, values['output-dir']);
}
