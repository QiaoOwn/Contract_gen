import {ParserRuleContext} from 'antlr4';

const transparent = new Set(['RuleOCLExpressionCSContext', 'RuleNestedExpCSContext']);
const expressions = new Set([
  ...transparent,
  'RuleLogicFormulaExpCSContext',
  'RuleAtomicExpressionContext',
  'RuleIfExpCSContext',
  'RuleLetExpCSContext',
]);
const contexts = (node: ParserRuleContext) =>
  (node.children ?? []).filter(
    (child): child is ParserRuleContext => child instanceof ParserRuleContext
  );

function unwrap(node: ParserRuleContext): ParserRuleContext {
  const children = contexts(node);
  if (
    (transparent.has(node.constructor.name) ||
      (node.constructor.name === 'RuleLogicFormulaExpCSContext' && node.children?.length === 1)) &&
    children.length === 1
  )
    return unwrap(children[0]);
  return node;
}

function identity(node: ParserRuleContext): string {
  const current = unwrap(node);
  return JSON.stringify([
    current.constructor.name,
    ...(current.children ?? []).map((child) =>
      child instanceof ParserRuleContext ? JSON.parse(identity(child)) : ['token', child.getText()]
    ),
  ]);
}

function booleanParts(node: ParserRuleContext) {
  const current = unwrap(node);
  if (current.constructor.name !== 'RuleLogicFormulaExpCSContext') return null;
  const operands = contexts(current);
  const operators = (current.children ?? [])
    .filter((child) => !(child instanceof ParserRuleContext))
    .map((child) => child.getText());
  if (
    operands.length < 2 ||
    operators.length !== operands.length - 1 ||
    !operators.every((operator) => operator === operators[0] && ['and', 'or'].includes(operator))
  )
    return null;
  return {operands, operator: operators[0]};
}

function location(node: ParserRuleContext) {
  return {
    line: node.start.line,
    column: node.start.column + 1,
    startOffset: node.start.start,
    endOffset: (node.stop?.stop ?? node.start.stop) + 1,
  };
}

type Selection = {
  kind: 'subtree' | 'boolean-segment';
  nodes: ParserRuleContext[];
  binder?: ParserRuleContext;
  operator?: string;
};
function selection(actual: ParserRuleContext, requested: ParserRuleContext): Selection | null {
  const node = unwrap(actual);
  const anchor = unwrap(requested);
  if (identity(node) === identity(anchor)) return {kind: 'subtree' as const, nodes: [node]};
  const source = booleanParts(node),
    target = booleanParts(anchor);
  if (source && target && source.operator === target.operator) {
    const keys = target.operands.map(identity);
    for (let start = 0; start + keys.length <= source.operands.length; start++) {
      const nodes = source.operands.slice(start, start + keys.length);
      if (nodes.every((part, index) => identity(part) === keys[index]))
        return {kind: 'boolean-segment' as const, nodes, operator: source.operator};
    }
  }
  // A let-scoped obligation may cover only part of its body, with identical binders.
  if (
    node.constructor.name === 'RuleLetExpCSContext' &&
    anchor.constructor.name === node.constructor.name
  ) {
    const sourceChildren = contexts(node),
      targetChildren = contexts(anchor);
    const body = sourceChildren.at(-1),
      requestedBody = targetChildren.at(-1);
    if (
      body &&
      requestedBody &&
      sourceChildren.length === targetChildren.length &&
      sourceChildren
        .slice(0, -1)
        .every((part, index) => identity(part) === identity(targetChildren[index]))
    ) {
      const selected = selection(body, requestedBody);
      if (selected) return {...selected, binder: node};
    }
  }
  return null;
}

export type ConstraintEvidenceMatch = {
  kind: 'subtree' | 'boolean-segment';
  coordinateSpace: 'assembled-contract';
  line: number;
  column: number;
  startOffset: number;
  endOffset: number;
  expression: string;
  contextPath: {
    kind: string;
    line: number;
    column: number;
    startOffset: number;
    endOffset: number;
  }[];
};

export function matchConstraintEvidence(
  root: ParserRuleContext,
  anchor: ParserRuleContext
): ConstraintEvidenceMatch[] {
  const matches: ConstraintEvidenceMatch[] = [];
  const walk = (node: ParserRuleContext, parents: ParserRuleContext[]) => {
    if (expressions.has(node.constructor.name)) {
      const selected = selection(node, anchor);
      if (selected) {
        const first = selected.nodes[0],
          last = selected.nodes.at(-1)!;
        const scopes = selected.binder ? [...parents, selected.binder] : parents;
        matches.push({
          kind: selected.kind,
          coordinateSpace: 'assembled-contract',
          ...location(first),
          endOffset: location(last).endOffset,
          expression: selected.nodes.map((part) => part.getText()).join(selected.operator ?? ''),
          contextPath: scopes
            .filter((parent) =>
              ['RuleLetExpCSContext', 'RuleIfExpCSContext', 'RuleIteratorExpCSContext'].includes(
                parent.constructor.name
              )
            )
            .map((parent) => ({kind: parent.constructor.name, ...location(parent)})),
        });
      }
    }
    for (const child of contexts(node)) walk(child, [...parents, node]);
  };
  walk(root, []);
  return [...new Map(matches.map((match) => [JSON.stringify(match), match])).values()];
}
