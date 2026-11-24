import type {ParserRuleContext} from 'antlr4';
import {DIALECT_DIAGNOSTIC_RULES, type DialectDiagnosticCode} from './dialectDiagnosticRules';
import {
  RuleClassiferCallExpCSContext,
  RuleContractContext,
  RuleDefinitionContext,
  RuleIsMarkedPreCSContext,
  RuleIteratorExpCSContext,
  RuleLetExpCSContext,
  RuleOperationCallExpCSContext,
  RulePostconditionContext,
  RulePreconditionContext,
  RuleStandardNoneParameterOperationContext,
  RuleVariableDeclarationCSContext,
  RuleVariableExpCSContext,
} from '../../../antlr4/REMODELParser';

export type GeneratedContractDiagnostic = Readonly<{
  line: number;
  column: number;
  msg: string;
  code: DialectDiagnosticCode;
  clause?: Clause;
  ruleIds: readonly string[];
}>;

type Clause = 'definition' | 'precondition' | 'postcondition';

const locationOf = (node: ParserRuleContext) => {
  const start = (
    node as ParserRuleContext & {
      start?: {line?: number; column?: number};
    }
  ).start;
  return {
    line: start?.line || 1,
    column: (start?.column || 0) + 1,
  };
};

const nearestBindingScope = (ancestors: readonly ParserRuleContext[]) =>
  [...ancestors]
    .reverse()
    .find(
      (node) =>
        node instanceof RuleIteratorExpCSContext ||
        node instanceof RuleLetExpCSContext ||
        node instanceof RuleDefinitionContext
    );

export const validateGeneratedContractSemantics = ({
  tree,
  hasReturnValue,
}: {
  tree: RuleContractContext;
  hasReturnValue: boolean;
}): GeneratedContractDiagnostic[] => {
  const diagnostics: GeneratedContractDiagnostic[] = [];

  const report = (
    node: ParserRuleContext,
    code: DialectDiagnosticCode,
    clause: Clause | undefined,
    msg: string
  ) => {
    diagnostics.push({
      ...locationOf(node),
      code,
      clause,
      ruleIds: DIALECT_DIAGNOSTIC_RULES[code].ruleIds,
      msg: `[generation-semantics] ${msg}`,
    });
  };

  const walk = (
    node: ParserRuleContext,
    clause: Clause | undefined,
    ancestors: readonly ParserRuleContext[]
  ): void => {
    const currentClause: Clause | undefined =
      node instanceof RuleDefinitionContext
        ? 'definition'
        : node instanceof RulePreconditionContext
          ? 'precondition'
          : node instanceof RulePostconditionContext
            ? 'postcondition'
            : clause;

    if (node instanceof RuleOperationCallExpCSContext) {
      report(
        node,
        'DIA_OPERATION_CALL_UNSUPPORTED',
        currentClause,
        'User-defined operation calls are outside the generated subset because no callable-operation contract is supplied.'
      );
    }

    if (
      node instanceof RuleClassiferCallExpCSContext &&
      node.getText().includes('.allInstance()')
    ) {
      report(
        node,
        'DIA_REPOSITORY_SPELLING',
        currentClause,
        'Use the standard allInstances() spelling in generated contracts.'
      );
    }

    if (
      node instanceof RuleIteratorExpCSContext &&
      node.ruleIteratorIdentifier().getText() === 'collect'
    ) {
      report(
        node,
        'DIA_COLLECT_UNSUPPORTED',
        currentClause,
        'collect produces a Bag in standard OCL, but Bag is outside the executable generated subset. Use a Set-preserving query or report the requirement as unsupported.'
      );
    }

    if (node instanceof RuleVariableExpCSContext && node.getText() === 'result') {
      if (currentClause !== 'postcondition') {
        report(
          node,
          'DIA_RESULT_SCOPE',
          currentClause,
          'result is permitted only in a postcondition.'
        );
      } else if (!hasReturnValue) {
        report(
          node,
          'DIA_RESULT_WITHOUT_RETURN',
          currentClause,
          'result cannot be used because the operation has no declared return type.'
        );
      }
    }

    if (
      node instanceof RuleIteratorExpCSContext &&
      ['sumBy', 'projectSet'].includes(node.ruleIteratorIdentifier().getText()) &&
      node.ruleVariableDeclarationCS_list().length !== 1
    )
      report(
        node,
        'DIA_AGGREGATE_BINDING',
        currentClause,
        'Projection/reduction requires exactly one typed iterator.'
      );
    if (
      node instanceof RuleStandardNoneParameterOperationContext &&
      node.getText() === 'oclIsNew()' &&
      ancestors.some(
        (parent) =>
          parent instanceof RuleIteratorExpCSContext &&
          ['sumBy', 'projectSet'].includes(parent.ruleIteratorIdentifier().getText())
      )
    )
      report(
        node,
        'DIA_AGGREGATE_EFFECT',
        currentClause,
        'Projection/reduction selectors cannot create objects.'
      );

    if (node instanceof RuleIsMarkedPreCSContext && currentClause !== 'postcondition') {
      report(
        node,
        'DIA_PRESTATE_SCOPE',
        currentClause,
        '@pre is permitted only in a postcondition.'
      );
    }

    if (
      node instanceof RuleStandardNoneParameterOperationContext &&
      node.getText() === 'oclIsNew()' &&
      currentClause !== 'postcondition'
    ) {
      report(
        node,
        'DIA_NEWNESS_SCOPE',
        currentClause,
        'oclIsNew() is permitted only in a postcondition.'
      );
    }

    if (node instanceof RuleVariableDeclarationCSContext) {
      const scope = nearestBindingScope(ancestors);
      const hasType = Boolean(node.ruleTypeCS());
      const hasInitializer = Boolean(node.ruleOCLExpressionCS());

      if (scope instanceof RuleDefinitionContext) {
        if (!hasType || !hasInitializer) {
          report(
            node,
            'DIA_DEFINITION_BINDING',
            currentClause,
            'A definition binding requires an explicit type and initializer.'
          );
        }
      } else if (scope instanceof RuleIteratorExpCSContext) {
        if (!hasType || hasInitializer) {
          report(
            node,
            'DIA_ITERATOR_BINDING',
            currentClause,
            'An iterator binding requires an explicit type and no initializer.'
          );
        }
      } else if (scope instanceof RuleLetExpCSContext && !hasType) {
        report(node, 'DIA_LET_BINDING', currentClause, 'A let binding requires an explicit type.');
      }
    }

    const nextAncestors = [...ancestors, node];
    for (const child of node.children || []) {
      if (child && typeof (child as ParserRuleContext).getText === 'function') {
        walk(child as ParserRuleContext, currentClause, nextAncestors);
      }
    }
  };

  walk(tree, undefined, []);
  return diagnostics;
};
