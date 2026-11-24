import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import policy from '../config/rm2pt-authority-policy.json';
import {formatStructuredRequirement, getBenchmarkRequirement} from '../src/rm2pt/benchmarkRequirements';
import {buildOperationInput} from '../src/app/service/createOperationInput';
import {createConstraintSolvingSystemPrompt, CONSTRAINT_SOLVER_PROMPT_VERSION} from '../src/app/service/constraintSolving';
import {auditRm2ptAuthority} from './audit_rm2pt_authority';

const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
type ReviewRow = {id: string; project: string; useCase: string; operation_name: string; source_alignment_status: string;
  description: string; rm2pt_authority: {source_path: string | null; source_line: number | null}; oracle_alignment_status: string};
const renderReview = (rows: ReviewRow[]) => {
  const columns = ['id', 'project', 'useCase', 'operation_name', 'source_alignment_status', 'description', 'source_path', 'source_line', 'oracle_alignment_status', 'reviewer', 'decision', 'rationale'];
  const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [columns.join(','), ...rows.map(row => [row.id, row.project, row.useCase, row.operation_name,
    row.source_alignment_status, row.description, row.rm2pt_authority.source_path, row.rm2pt_authority.source_line,
    row.oracle_alignment_status, '', '', ''].map(cell).join(','))].join('\n') + '\n';
};
export function buildRm2ptAuthoritativeInput(input: string, output: string, refresh = false) {
  const policyHash = hash(fs.readFileSync('config/rm2pt-authority-policy.json'));
  const exists = fs.existsSync(output);
  if (exists && !refresh) throw new Error('Use a new output directory or guarded --refresh for the active prepared input');
  let snapshot: string | null = null;
  if (exists) {
    if (path.resolve(output, 'operations.jsonl') !== path.resolve(policy.new_input))
      throw new Error('Refresh is limited to the active prepared input');
    const previous = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'));
    const previousData = fs.readFileSync(path.join(output, 'operations.jsonl'));
    if (previous.version !== 'rm2pt-authoritative-input-preparation-v1' || previous.formal_experiment_ready !== false ||
        hash(previousData) !== previous.output_sha256 || previous.parent_input !== input ||
        hash(fs.readFileSync(input)) !== previous.parent_input_sha256)
      throw new Error('Prepared input integrity/provenance changed; review before refreshing');
    if (previous.authority_policy_sha256 === policyHash)
      throw new Error('Policy is unchanged; no refresh is needed');
    const previousRows = previousData.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
    if (fs.readFileSync(path.join(output, 'source-fidelity-review.csv'), 'utf8') !== renderReview(previousRows) ||
        JSON.parse(fs.readFileSync(path.join(output, 'pending-decisions.json'), 'utf8')).some((item: {reviewer_decision: unknown}) => item.reviewer_decision != null))
      throw new Error('Preserve filled review decisions; manual merge is required');
    snapshot = `results/rm2pt-authority-alignment/before-${previous.authority_policy_sha256.slice(0, 16)}`;
    if (fs.existsSync(snapshot)) throw new Error('Previous snapshot already exists; inspect the interrupted refresh');
    fs.mkdirSync(snapshot, {recursive: true});
    for (const file of ['manifest.json', 'operations.jsonl', 'pending-decisions.json', 'requirement-changes.json',
      'source-fidelity-review.csv', 'evaluation-only-source-contracts.jsonl'])
      fs.copyFileSync(path.join(output, file), path.join(snapshot, file));
  }
  fs.mkdirSync(output, {recursive: true});
  const parentBytes = fs.readFileSync(input);
  const rows = parentBytes.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  if (rows.length !== 114 || new Set(rows.map(row => row.id)).size !== 114) throw new Error('Expected 114 unique operations');
  const auditDirectory = exists ? `authority-audit-${policyHash.slice(0, 16)}` : 'authority-audit';
  auditRm2ptAuthority(input, path.join(output, auditDirectory));
  const auditRows = fs.readFileSync(path.join(output, auditDirectory, 'operation-audit.jsonl'), 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
  const approved = Object.entries(policy.approved_source_corrections).map(([id, entry]) => {
    const bytes = fs.readFileSync(entry.decision_file);
    const record = JSON.parse(bytes.toString('utf8'));
    if (record.status !== 'APPROVED' || record.operation_id !== id || record.decision_id !== entry.decision_id ||
        hash(fs.readFileSync(record.source_file)) !== record.source_sha256)
      throw new Error(`Source correction approval/evidence mismatch: ${id}`);
    return {id, ...entry, decision_sha256: hash(bytes)};
  });
  const mappings = Object.entries(policy.approved_source_mappings).map(([id, entry]) => {
    const bytes = fs.readFileSync(entry.decision_file);
    const record = JSON.parse(bytes.toString('utf8'));
    if (record.status !== 'APPROVED' || record.operation_id !== id || record.decision_id !== entry.decision_id ||
        hash(fs.readFileSync(record.source_file)) !== record.source_sha256 || approved.some(item => item.id === id))
      throw new Error(`Source mapping approval/evidence mismatch: ${id}`);
    return {id, ...entry, decision_sha256: hash(bytes)};
  });
  const restorations = Object.entries(policy.approved_restored_drafts).map(([id, entry]) => {
    const bytes = fs.readFileSync(entry.decision_file);
    const record = JSON.parse(bytes.toString('utf8'));
    const row = rows.find(item => item.id === id);
    const requirement = row && getBenchmarkRequirement(row.project, row.useCase, row.operation_name);
    if (record.status !== 'APPROVED' || record.operation_id !== id || record.decision_id !== entry.decision_id ||
        hash(fs.readFileSync(record.source_file)) !== record.source_sha256 ||
        approved.some(item => item.id === id) || mappings.some(item => item.id === id) || !row ||
        JSON.stringify(record.approved_parameters) !== JSON.stringify(row.parameters.map((item: {name: string; type: string}) => ({name: item.name, type: item.type}))) ||
        record.approved_return_type !== row.return_type ||
        JSON.stringify(record.approved_preconditions) !== JSON.stringify(requirement?.preconditions) ||
        JSON.stringify(record.approved_postconditions) !== JSON.stringify(requirement?.postconditions))
      throw new Error(`Restored draft approval/requirement mismatch: ${id}`);
    return {id, ...entry, decision_sha256: hash(bytes)};
  });
  const resolvedSource = (item: typeof auditRows[number]) => item.rm2ptSource ?? item.labApprovedDraft;
  const sourceKey = (item: typeof auditRows[number]) => {
    const source = resolvedSource(item);
    return source ? `${item.labApprovedDraft ? 'lab-restored-draft:' : ''}${policy.source_commit}:${source.path}::${source.service}::${source.operation}` : null;
  };
  const promptHash = hash(createConstraintSolvingSystemPrompt());
  const pending: Record<string, unknown>[] = [];
  const changes: Record<string, unknown>[] = [];
  const updated = rows.map(row => {
    const source = auditRows.find(item => item.id === row.id)!;
    const description = formatStructuredRequirement(getBenchmarkRequirement(row.project, row.useCase, row.operation_name));
    const built = buildOperationInput({project: row.project, useCase: row.useCase, operation: row.operation_name,
      userInput: description, constraintSolving: true});
    const conflict = (policy.source_conflicts as Record<string, string>)[row.id];
    const missing = (policy.missing_or_aliased_sources as Record<string, string>)[row.id];
    const adaptation = (policy.documented_dialect_adaptations as Record<string, string>)[row.id];
    const correction = approved.find(item => item.id === row.id);
    const mapping = mappings.find(item => item.id === row.id);
    const restoration = restorations.find(item => item.id === row.id);
    const decision = correction ?? mapping ?? restoration;
    if (decision && (conflict || missing)) throw new Error(`Contradictory source disposition: ${row.id}`);
    const disposition = correction ? 'USER_APPROVED_SOURCE_CORRECTION'
      : mapping ? 'USER_APPROVED_SOURCE_MAPPING'
      : restoration ? 'LAB_APPROVED_RESTORED_COMMENTED_DRAFT'
      : conflict ? 'SOURCE_CONFLICT_REQUIRES_DECISION' : missing ? 'SOURCE_MAPPING_REQUIRES_DECISION'
      : adaptation ? 'DOCUMENTED_DIALECT_ADAPTATION' : source.status === 'CLAUSE_SHAPE_ALIGNED' ? 'CLAUSE_SHAPE_ALIGNED' : 'UNREVIEWED_SOURCE_DIFFERENCE';
    if (conflict || missing || disposition === 'UNREVIEWED_SOURCE_DIFFERENCE') pending.push({id: row.id, disposition,
      reason: conflict || missing || 'Unexpected source/catalog difference', source: source.rm2ptSource,
      previous_lab_decision_retained: true, reviewer_decision: null});
    if (description !== row.description) changes.push({id: row.id, previous_requirement_hash: hash(row.description),
      new_requirement_hash: hash(description), previous_description: row.description, new_description: description});
    return {...row,
      description_previous: row.description, description,
      canonical_user_message: built.content, model_context: built.modelContext,
      requirement_hash: built.metadata.requirementHash, context_hash: built.metadata.contextHash, input_hash: built.metadata.inputHash,
      requirement_group_id: built.metadata.requirementHash,
      input_schema_version: built.metadata.schemaVersion, requirement_provenance: 'rm2pt-authority-reconciliation-pending-fidelity-review',
      prompt_version: CONSTRAINT_SOLVER_PROMPT_VERSION, prompt_hash: promptHash,
      model_grounding_rules_hash: built.modelGroundingContext.rules.rulesHash,
      model_validation_rules_hash: built.modelGroundingContext.rules.rulesHash,
      model_grounding_rules_count: built.modelGroundingContext.rules.rules.length,
      constraint_solving: true, constraint_task_plan_hash: built.constraintTaskPlan!.hash,
      constraint_policy_hash: built.constraintTaskPlan!.policyHash,
      source_alignment_status: disposition,
      quality_status: missing ? 'NEEDS_SOURCE' : 'NEEDS_REVIEW',
      rm2pt_authority: {policy_version: policy.version, commit: policy.source_commit,
        source_path: resolvedSource(source)?.path ?? null, source_line: resolvedSource(source)?.line ?? null,
        source_sha256: resolvedSource(source)?.sha256 ?? null,
        source_service: resolvedSource(source)?.service ?? null, source_operation: resolvedSource(source)?.operation ?? null,
        original_active_contract: Boolean(source.rm2ptSource),
        source_resolution: source.sourceResolution,
        source_operation_key: sourceKey(source),
        shared_source_operation_ids: sourceKey(source) ? auditRows.filter(item => sourceKey(item) === sourceKey(source)).map(item => item.id) : [],
        decision_id: decision?.decision_id ?? null, decision_file: decision?.decision_file ?? null,
        decision_sha256: decision?.decision_sha256 ?? null,
        note: decision?.note || conflict || missing || adaptation || 'Clause-shape alignment is not a semantic fidelity or Oracle certification.'},
      oracle_alignment_status: 'PENDING_RM2PT_AUTHORITY_REVIEW',
      experimental_readiness: false,
      oracle_available_to_generator: false,
    };
  });
  const bytes = updated.map(row => JSON.stringify(row)).join('\n') + '\n';
  fs.writeFileSync(path.join(output, 'operations.jsonl'), bytes);
  // Source clauses stay outside the generation input, strictly for evidence review.
  fs.writeFileSync(path.join(output, 'evaluation-only-source-contracts.jsonl'), auditRows.map(row =>
    JSON.stringify({id: row.id, role: 'evaluation_only_source_evidence_not_generated_ground_truth',
      source: row.rm2ptSource, lab_approved_draft: row.labApprovedDraft ?? null, source_resolution: row.sourceResolution})).join('\n') + '\n');
  fs.writeFileSync(path.join(output, 'pending-decisions.json'), JSON.stringify(pending, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'requirement-changes.json'), JSON.stringify(changes, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'source-fidelity-review.csv'), renderReview(updated));
  const manifest = {version: 'rm2pt-authoritative-input-preparation-v1', role: 'source-reconciliation-not-ready-for-formal-experiment',
    authority_policy: 'config/rm2pt-authority-policy.json', authority_policy_sha256: policyHash,
    audit_directory: auditDirectory, previous_preparation_snapshot: snapshot,
    approved_source_correction_count: approved.length, approved_source_corrections: approved,
    approved_source_mapping_count: mappings.length, approved_source_mappings: mappings,
    approved_restored_draft_count: restorations.length, approved_restored_drafts: restorations,
    parent_input: input, parent_input_sha256: hash(parentBytes), output_sha256: hash(bytes),
    operation_count: updated.length, requirement_change_count: changes.length, unresolved_source_operation_count: pending.length,
    pending_requirement_fidelity_review_count: 114, pending_oracle_alignment_count: 114,
    solver_prompt_version: CONSTRAINT_SOLVER_PROMPT_VERSION, solver_prompt_hash: promptHash,
    formal_experiment_ready: false, previous_input_oracle_results_modified: false, upstream_modified: false,
    model_calls: 0, hidden_evaluations: 0,
    note: 'All 114 operations are retained. Source conflicts, commented drafts and service aliases are not silently repaired or certified. Existing laboratory decisions remain historical evidence, not original-source equivalence.'};
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (hash(fs.readFileSync(input)) !== hash(parentBytes)) throw new Error('Previous frozen input changed');
  console.log(JSON.stringify(manifest, null, 2));
  return manifest;
}
if (require.main === module) {
  const {values} = parseArgs({options: {input: {type: 'string', default: 'data/benchmark/lab_adjudicated_114_v2/operations-lab-adjudicated-114-v2.jsonl'},
    'output-dir': {type: 'string', default: 'data/benchmark/rm2pt_authoritative_114'}, refresh: {type: 'boolean', default: false}}});
  buildRm2ptAuthoritativeInput(values.input!, values['output-dir']!, values.refresh);
}
