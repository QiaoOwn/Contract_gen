import type {ParserRuleContext} from 'antlr4';
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

  const report = (node: ParserRuleContext, msg: string) => {
    diagnostics.push({...locationOf(node), msg: `[generation-semantics] ${msg}`});
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
        'User-defined operation calls are outside the generated subset because no callable-operation contract is supplied.'
      );
    }

    if (
      node instanceof RuleClassiferCallExpCSContext &&
      node.getText().includes('.allInstance()')
    ) {
      report(node, 'Use the standard allInstances() spelling in generated contracts.');
    }

    if (node instanceof RuleVariableExpCSContext && node.getText() === 'result') {
      if (currentClause !== 'postcondition') {
        report(node, 'result is permitted only in a postcondition.');
      } else if (!hasReturnValue) {
        report(node, 'result cannot be used because the operation has no declared return type.');
      }
    }

    if (node instanceof RuleIsMarkedPreCSContext && currentClause !== 'postcondition') {
      report(node, '@pre is permitted only in a postcondition.');
    }

    if (
      node instanceof RuleStandardNoneParameterOperationContext &&
      node.getText() === 'oclIsNew()' &&
      currentClause !== 'postcondition'
    ) {
      report(node, 'oclIsNew() is permitted only in a postcondition.');
    }

    if (node instanceof RuleVariableDeclarationCSContext) {
      const scope = nearestBindingScope(ancestors);
      const hasType = Boolean(node.ruleTypeCS());
      const hasInitializer = Boolean(node.ruleOCLExpressionCS());

      if (scope instanceof RuleDefinitionContext) {
        if (!hasType || !hasInitializer) {
          report(node, 'A definition binding requires an explicit type and initializer.');
        }
      } else if (scope instanceof RuleIteratorExpCSContext) {
        if (!hasType || hasInitializer) {
          report(node, 'An iterator binding requires an explicit type and no initializer.');
        }
      } else if (scope instanceof RuleLetExpCSContext && !hasType) {
        report(node, 'A let binding requires an explicit type.');
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
