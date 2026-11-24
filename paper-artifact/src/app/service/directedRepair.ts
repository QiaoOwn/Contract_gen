import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairDiagnostic} from './repairDiagnostics';
import {
  analyzeRepairCandidate,
  auditRepairChange,
  type RepairCandidate,
} from './repairLocalization';
import type {ContractClause, OclLocation} from './modelRuleDiagnostics';
import type {GenerationTaskPlan} from './generationTaskPlan';
import {ParserRuleContext, TerminalNode} from 'antlr4';
import {RuleAtomicExpressionContext} from '../../../antlr4/REMODELParser';
import {parse} from '../util';

export const DIRECTED_REPAIR_VERSION = 'program-directed-repair-v1';
const covers = (region: OclLocation, site: OclLocation) =>
  region.clause === site.clause &&
  region.startOffset <= site.startOffset &&
  region.endOffset >= site.endOffset;

function booleanContexts(contract: string) {
  const {tree} = parse(contract);
  const contexts = new Map<string, string>();
  const walk = (node: ParserRuleContext, parents: string[]) => {
    const operators = [
      ...new Set(
        (node.children ?? []).flatMap((child) =>
          child instanceof TerminalNode &&
          ['and', 'or', 'xor', 'implies', 'not'].includes(child.getText())
            ? [child.getText()]
            : []
        )
      ),
    ].sort();
    const path = operators.length ? [...parents, operators.join(',')] : parents;
    if (node instanceof RuleAtomicExpressionContext)
      contexts.set(
        `${node.start.start}:${(node.stop?.stop ?? node.start.stop) + 1}`,
        JSON.stringify(path)
      );
    for (const child of node.children ?? [])
      if (child instanceof ParserRuleContext) walk(child, path);
  };
  if (tree) walk(tree, []);
  return contexts;
}

export function createRepairDirective(
  candidate: RepairCandidate,
  diagnostics: RepairDiagnostic[],
  context: OperationModelGrounding
) {
  const analysis = analyzeRepairCandidate(candidate, context);
  const regions: OclLocation[] = [];
  const coarse = new Set<ContractClause>();
  const additions = new Set<ContractClause>();
  for (const diagnostic of diagnostics) {
    const localized = diagnostic.localization;
    if (localized && localized.resolution !== 'clause-only') {
      regions.push(
        ...localized.candidates,
        ...localized.dependencies.map((item) => item.declaration)
      );
      localized.gaps.forEach((gap) => additions.add(gap.clause));
      continue;
    }
    const scopes = diagnostic.candidateScopes ?? [];
    for (const scope of scopes) {
      const hits =
        analysis?.evidence.expressions.filter(
          (site) => site.clause === scope.clause && site.expression === scope.expression
        ) ?? [];
      if (hits.length) regions.push(...hits);
      else coarse.add(scope.clause);
    }
    if (!scopes.length && diagnostic.location.clause) coarse.add(diagnostic.location.clause);
  }
  const known = regions.length > 0 || coarse.size > 0 || additions.size > 0;
  const expressions = analysis?.evidence.expressions ?? [];
  // An AST node that encloses an editable descendant is not an independent frozen obligation.
  const protectedExpressions = expressions.filter(
    (site) =>
      !coarse.has(site.clause) &&
      !regions.some((region) => covers(region, site) || covers(site, region))
  );
  return {
    version: DIRECTED_REPAIR_VERSION,
    resolution:
      !analysis || !known
        ? ('unresolved' as const)
        : coarse.size
          ? ('clause-scoped' as const)
          : ('expression-scoped' as const),
    diagnosticCodes: diagnostics.map((item) => item.code),
    obligationIds: [...new Set(diagnostics.flatMap((item) => item.obligationIds))],
    regions,
    additionClauses: [...additions],
    coarseClauses: [...coarse],
    protectedExpressions: analysis && known ? protectedExpressions : [],
  };
}
export type RepairDirective = ReturnType<typeof createRepairDirective>;

export const renderRepairDirective = (
  directive: RepairDirective,
  plan?: GenerationTaskPlan | null
) =>
  [
    `Program-issued repair directive: ${directive.version}; resolution ${directive.resolution}`,
    ...(plan ? [`Unchanged generation task plan: ${plan.hash}`] : []),
    `Diagnosed obligations: ${directive.obligationIds.join(', ') || '(not resolved)'}`,
    'Return the complete contract JSON, but preserve protected expressions and their conditional guards. The program audits the actual candidate changes; self-reported compliance is not accepted.',
    ...directive.regions.map(
      (site) =>
        `Editable candidate/dependency: ${site.clause}, assembled-contract offsets [${site.startOffset}, ${site.endOffset}): ${site.expression}`
    ),
    ...directive.additionClauses.map(
      (clause) =>
        `Possible omission in ${clause}: add a requirement-justified expression without deleting existing obligations. No exact insertion point is established.`
    ),
    ...directive.coarseClauses.map(
      (clause) =>
        `Only a coarse search scope is known for ${clause}; no exact fault site is asserted.`
    ),
    ...directive.protectedExpressions.map(
      (site) =>
        `Protected ${site.clause}: ${site.expression}${site.guards.length ? `; guards: ${site.guards.map((guard) => guard.expression).join('; ')}` : ''}`
    ),
    'Do not edit the requirement, model declarations, signature, rules or tests. The complete candidate must pass validation again.',
  ].join('\n');

export function auditDirectedRepair(
  before: RepairCandidate,
  after: RepairCandidate,
  context: OperationModelGrounding,
  diagnostics: RepairDiagnostic[]
) {
  const directive = createRepairDirective(before, diagnostics, context);
  const revised = analyzeRepairCandidate(after, context);
  const clauseAudit = auditRepairChange(before, after, context, diagnostics);
  const remaining = [...(revised?.evidence.expressions ?? [])];
  const guardKey = (site: {guards: OclLocation[]}) =>
    JSON.stringify(site.guards.map((guard) => guard.expression));
  const previous = analyzeRepairCandidate(before, context);
  const oldContexts = previous ? booleanContexts(previous.contract) : new Map<string, string>();
  const newContexts = revised ? booleanContexts(revised.contract) : new Map<string, string>();
  const violations = directive.protectedExpressions.filter((site) => {
    const original = previous!.evidence.expressions.find(
      (item) => item.startOffset === site.startOffset && item.endOffset === site.endOffset
    )!;
    const at = remaining.findIndex(
      (item) =>
        item.clause === site.clause &&
        item.ast === original.ast &&
        guardKey(item) === guardKey(original) &&
        oldContexts.get(`${original.startOffset}:${original.endOffset}`) ===
          newContexts.get(`${item.startOffset}:${item.endOffset}`)
    );
    if (at < 0) return true;
    remaining.splice(at, 1);
    return false;
  });
  const resolved = directive.resolution !== 'unresolved' && Boolean(revised);
  return {
    version: DIRECTED_REPAIR_VERSION,
    directive,
    status: !resolved
      ? 'unresolved'
      : violations.length || clauseAudit.blocked
        ? 'scope-violation'
        : 'protected-expressions-preserved',
    blocked: clauseAudit.blocked || (resolved && violations.length > 0),
    violations: resolved ? violations : [],
    clauseAudit,
    note: 'Checks preservation of unrelated indexed expressions, guards and enclosing Boolean operators, not minimality, arbitrary added constraints, or semantic correctness. Validation and development checks remain mandatory.',
  };
}
export type DirectedRepairAudit = ReturnType<typeof auditDirectedRepair>;
