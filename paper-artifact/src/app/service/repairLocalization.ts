import {generateContractCode, parse} from '../util';
import type {ParserRuleContext} from 'antlr4';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import type {RepairDiagnostic} from './repairDiagnostics';
import {oclSyntaxIdentity, validateModelGroundedContract} from './validateModelGroundedContract';

export type RepairCandidate = Record<ContractClause, string>;
const clauses: ContractClause[] = ['definition', 'precondition', 'postcondition'];

export function analyzeRepairCandidate(ocl: RepairCandidate, context: OperationModelGrounding) {
  const {operation} = context.index;
  const contract = generateContractCode({
    serviceName: operation.service,
    operationName: operation.name,
    parameters: operation.parameters.map((item) => ({name: item.name, type: item.type.raw})),
    returnedType: operation.returnType?.type.raw,
    ...ocl,
  });
  const {tree, errors} = parse(contract);
  if (!tree || errors.length) return null;
  const validation = validateModelGroundedContract({tree, context, collectRepairEvidence: true});
  const region = (node: ParserRuleContext | null, clause: ContractClause): OclLocation | null =>
    node
      ? {
          clause,
          line: node.start.line,
          column: node.start.column + 1,
          endLine: node.stop?.line ?? node.start.line,
          endColumn: (node.stop?.column ?? node.start.column) + (node.stop?.text?.length ?? 1) + 1,
          startOffset: node.start.start,
          endOffset: (node.stop?.stop ?? node.start.stop) + 1,
          expression: node.getText(),
        }
      : null;
  return {
    contract,
    evidence: validation.repairEvidence!,
    modelEvidenceComplete: validation.diagnostics.length === 0 && validation.deferred.length === 0,
    clauseRegions: {
      definition: region(tree.ruleDefinition(), 'definition'),
      precondition: region(tree.rulePrecondition().ruleOCLExpressionCS(), 'precondition'),
      postcondition: region(tree.rulePostcondition().ruleOCLExpressionCS(), 'postcondition'),
    },
    clauses: {
      definition: tree.ruleDefinition() ? oclSyntaxIdentity(tree.ruleDefinition()) : '',
      precondition: oclSyntaxIdentity(tree.rulePrecondition()),
      postcondition: oclSyntaxIdentity(tree.rulePostcondition()),
    },
  };
}
export type CandidateAnalysis = ReturnType<typeof analyzeRepairCandidate>;
type ExpressionCandidate = OclLocation & {modelElementIds: string[]; guards: OclLocation[]};
export type BehaviorLocalization = {
  version: 'model-grounded-localization-v2';
  coordinateSpace: 'assembled-contract';
  resolution: 'expression-candidates' | 'obligation-gap-candidates' | 'clause-only';
  rootCauseEstablished: false;
  candidates: ExpressionCandidate[];
  contextAnchors: ExpressionCandidate[];
  gaps: {
    obligationId?: string;
    clause: ContractClause;
    targets: {name: string; modelElementId: string}[];
    evidence: 'no-indexed-target-reference-in-affected-clause';
    insertionScope: 'clause-body-search-region';
    searchRegion: OclLocation;
  }[];
  dependencies: {id: string; name: string; declaration: OclLocation; uses: OclLocation[]}[];
  note: string;
};

export function localizeBehaviorRepair(
  analysis: CandidateAnalysis,
  obligations: {
    id?: string;
    clause: ContractClause;
    modelFeatures: string[];
    localizationTargets?: readonly string[];
  }[],
  declarations: {name: string; id: string}[]
): BehaviorLocalization {
  const evidence = analysis?.evidence;
  const byName = new Map<string, string[]>();
  for (const declaration of declarations)
    byName.set(declaration.name, [...(byName.get(declaration.name) ?? []), declaration.id]);
  const dependencyIds = new Set(
    obligations.flatMap((item) => item.modelFeatures.flatMap((name) => byName.get(name) ?? []))
  );
  const smallest = (hits: NonNullable<CandidateAnalysis>['evidence']['expressions']) =>
    hits.filter(
      (outer) =>
        !hits.some(
          (inner) =>
            inner !== outer &&
            inner.startOffset >= outer.startOffset &&
            inner.endOffset <= outer.endOffset &&
            (inner.startOffset !== outer.startOffset || inner.endOffset !== outer.endOffset)
        )
    );
  const find = (ids: Set<string>, clause: ContractClause) =>
    smallest(
      evidence?.expressions.filter(
        (expression) =>
          expression.clause === clause &&
          evidence.references.some(
            (reference) =>
              ids.has(reference.modelElementId) &&
              reference.clause === clause &&
              reference.startOffset >= expression.startOffset &&
              reference.endOffset <= expression.endOffset
          )
      ) ?? []
    );
  const hits: NonNullable<CandidateAnalysis>['evidence']['expressions'] = [];
  const anchors: typeof hits = [];
  const gaps: BehaviorLocalization['gaps'] = [];
  for (const obligation of obligations) {
    const explicit = obligation.localizationTargets;
    const validTargets =
      explicit?.length &&
      explicit.every((name) => obligation.modelFeatures.includes(name) && byName.has(name));
    const specific = obligation.modelFeatures.filter(
      (name) => name === '$result' || (!name.startsWith('$') && name.includes('.'))
    );
    const names =
      explicit !== undefined
        ? validTargets
          ? [...explicit]
          : []
        : specific.includes('$result')
          ? ['$result']
          : specific.length
            ? specific
            : obligation.modelFeatures;
    const ids = new Set(names.flatMap((name) => byName.get(name) ?? []));
    hits.push(...find(ids, obligation.clause));
    // Only explicitly annotated targets can yield an absence hypothesis. Context features
    // locate related code, but are never promoted to the missing target or a faulty statement.
    if (validTargets && analysis?.modelEvidenceComplete) {
      const absent = explicit!.filter(
        (name) =>
          !evidence?.references.some(
            (reference) =>
              reference.clause === obligation.clause &&
              byName.get(name)!.includes(reference.modelElementId)
          )
      );
      const searchRegion = analysis.clauseRegions[obligation.clause];
      if (absent.length && searchRegion) {
        gaps.push({
          ...(obligation.id ? {obligationId: obligation.id} : {}),
          clause: obligation.clause,
          targets: absent.flatMap((name) =>
            byName.get(name)!.map((modelElementId) => ({name, modelElementId}))
          ),
          evidence: 'no-indexed-target-reference-in-affected-clause',
          insertionScope: 'clause-body-search-region',
          searchRegion,
        });
        const contextIds = new Set(
          obligation.modelFeatures
            .filter((name) => !names.includes(name))
            .flatMap((name) => byName.get(name) ?? [])
        );
        anchors.push(...find(contextIds, obligation.clause));
      }
    }
  }
  const unique = (sites: typeof hits) => [
    ...new Map(
      sites.map((site) => [`${site.clause}:${site.startOffset}:${site.endOffset}`, site])
    ).values(),
  ];
  const candidates = unique(hits);
  const contextAnchors = unique(anchors);
  const relatedSites = [...candidates, ...contextAnchors];
  const needed = new Set(relatedSites.flatMap((item) => item.bindingIds));
  for (const binding of evidence?.bindings ?? []) {
    if (
      binding.uses.some((use) =>
        relatedSites.some((candidate) =>
          candidate.guards.some(
            (guard) =>
              use.clause === guard.clause &&
              use.startOffset >= guard.startOffset &&
              use.endOffset <= guard.endOffset
          )
        )
      )
    )
      needed.add(binding.id);
  }
  if (!relatedSites.length && evidence) {
    for (const binding of evidence.bindings) {
      const site = binding.declaration;
      if (
        site &&
        evidence.references.some(
          (reference) =>
            dependencyIds.has(reference.modelElementId) &&
            reference.startOffset >= site.startOffset &&
            reference.endOffset <= site.endOffset
        )
      )
        needed.add(binding.id);
    }
  }
  let changed = true;
  while (changed && evidence) {
    changed = false;
    for (const binding of evidence.bindings) {
      if (!needed.has(binding.id)) continue;
      for (const dependency of binding.dependsOn) {
        if (!needed.has(dependency)) {
          needed.add(dependency);
          changed = true;
        }
      }
    }
  }
  return {
    version: 'model-grounded-localization-v2',
    coordinateSpace: 'assembled-contract',
    resolution: gaps.length
      ? 'obligation-gap-candidates'
      : candidates.length
        ? 'expression-candidates'
        : 'clause-only',
    rootCauseEstablished: false,
    // The parse tree and binding cache are internal; only serializable locations leave this stage.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    candidates: candidates.map(({ast: _ast, bindingIds: _bindings, ...site}) => site),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contextAnchors: contextAnchors.map(({ast: _ast, bindingIds: _bindings, ...site}) => site),
    gaps,
    dependencies: (evidence?.bindings ?? []).flatMap((item) =>
      needed.has(item.id) && item.declaration ? [{...item, declaration: item.declaration}] : []
    ),
    note: gaps.length
      ? 'Source-linked targets have no direct indexed reference in the affected clause. Review a possible omitted obligation within the clause body. Context anchors are related code, not faulty statements; no exact insertion point, missing effect, or unique root cause is proven.'
      : candidates.length
        ? 'Exact model references locate candidate expressions, not a uniquely proven cause. Check their guards and binding dependencies against the cited requirement.'
        : 'No direct atomic expression was resolved in the affected clause. Inspect the clause and available definitions; absence here does not prove that the obligation is missing.',
  };
}

export type RepairChangeAudit = {
  version: 'repair-change-audit-v1';
  status: 'unchanged' | 'within-clause-scope' | 'outside-clause-scope' | 'unresolved';
  blocked: boolean;
  allowedClauses: ContractClause[];
  changedClauses: ContractClause[];
  outsideClauses: ContractClause[];
  expressionChanges: {clause: ContractClause; removed: string[]; added: string[]}[];
  note: string;
};
const subtract = (left: string[], right: string[]) => {
  const remaining = [...right];
  return left.filter((item) => {
    const index = remaining.indexOf(item);
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
};

export function auditRepairChange(
  before: RepairCandidate,
  after: RepairCandidate,
  context: OperationModelGrounding,
  diagnostics: RepairDiagnostic[]
): RepairChangeAudit {
  const previous = analyzeRepairCandidate(before, context);
  const revised = analyzeRepairCandidate(after, context);
  const scoped =
    diagnostics.length > 0 &&
    diagnostics.every((item) => item.location.clause || item.candidateScopes?.length);
  const allowedClauses = clauses.filter((clause) =>
    diagnostics.some(
      (item) =>
        item.location.clause === clause ||
        item.candidateScopes?.some((scope) => scope.clause === clause)
    )
  );
  const changedClauses = clauses.filter((clause) =>
    previous && revised
      ? previous.clauses[clause] !== revised.clauses[clause]
      : before[clause] !== after[clause]
  );
  const outsideClauses =
    scoped && previous && revised
      ? changedClauses.filter((clause) => !allowedClauses.includes(clause))
      : [];
  const expressionChanges = clauses.map((clause) => {
    const oldExpressions =
      previous?.evidence.expressions.filter((item) => item.clause === clause) ?? [];
    const newExpressions =
      revised?.evidence.expressions.filter((item) => item.clause === clause) ?? [];
    return {
      clause,
      removed: subtract(
        oldExpressions.map((item) => item.ast),
        newExpressions.map((item) => item.ast)
      ).map((ast) => oldExpressions.find((item) => item.ast === ast)!.expression),
      added: subtract(
        newExpressions.map((item) => item.ast),
        oldExpressions.map((item) => item.ast)
      ).map((ast) => newExpressions.find((item) => item.ast === ast)!.expression),
    };
  });
  return {
    version: 'repair-change-audit-v1',
    status:
      !previous || !revised || !scoped
        ? 'unresolved'
        : outsideClauses.length
          ? 'outside-clause-scope'
          : changedClauses.length
            ? 'within-clause-scope'
            : 'unchanged',
    blocked: outsideClauses.length > 0,
    allowedClauses,
    changedClauses,
    outsideClauses,
    expressionChanges,
    note: 'Clause-scope preservation is enforced only with two parseable candidates and resolved diagnostic scopes. Expression differences are audit evidence, not a proof of minimal or semantically correct repair; full validation remains required.',
  };
}
