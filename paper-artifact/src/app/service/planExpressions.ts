import {z} from 'zod';

export type PlanExpression =
  | {kind: 'ref'; id: string}
  | {kind: 'literal'; value: boolean | number | null}
  | {kind: 'undefined' | 'not' | 'pre' | 'size'; value: PlanExpression}
  | {kind: 'property'; object: PlanExpression; featureId: string}
  | {kind: 'enumeration'; featureId: string; literal: string}
  | {kind: 'binary'; op: '=' | '-' | '+' | '>'; left: PlanExpression; right: PlanExpression};

export const planExpressionSchema: z.ZodType<PlanExpression> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({kind: z.literal('ref'), id: z.string().min(1).max(512)}).strict(),
    z
      .object({
        kind: z.literal('literal'),
        value: z.union([z.boolean(), z.number().finite(), z.null()]),
      })
      .strict(),
    ...(['undefined', 'not', 'pre', 'size'] as const).map((kind) =>
      z.object({kind: z.literal(kind), value: planExpressionSchema}).strict()
    ),
    z
      .object({
        kind: z.literal('property'),
        object: planExpressionSchema,
        featureId: z.string().min(1).max(512),
      })
      .strict(),
    z
      .object({
        kind: z.literal('enumeration'),
        featureId: z.string().min(1).max(512),
        literal: z.string().regex(/^[A-Za-z_]\w*$/),
      })
      .strict(),
    z
      .object({
        kind: z.literal('binary'),
        op: z.enum(['=', '-', '+', '>']),
        left: planExpressionSchema,
        right: planExpressionSchema,
      })
      .strict(),
  ])
);

export function normalizePlanExpression(expression: PlanExpression, depth = 0): PlanExpression {
  if (depth > 12) throw new Error('Completion expression exceeds depth limit');
  if (
    expression.kind === 'ref' ||
    expression.kind === 'literal' ||
    expression.kind === 'enumeration'
  )
    return expression;
  if (expression.kind === 'property')
    return {...expression, object: normalizePlanExpression(expression.object, depth + 1)};
  if (expression.kind === 'binary')
    return {
      ...expression,
      left: normalizePlanExpression(expression.left, depth + 1),
      right: normalizePlanExpression(expression.right, depth + 1),
    };
  const value = normalizePlanExpression(expression.value, depth + 1);
  if (expression.kind === 'not' && value.kind === 'not') return value.value;
  if (expression.kind === 'not' && value.kind === 'literal' && typeof value.value === 'boolean')
    return {kind: 'literal', value: !value.value};
  return {kind: expression.kind, value};
}

export function planExpressionRefs(expression: PlanExpression): string[] {
  if (expression.kind === 'ref') return [expression.id];
  if (expression.kind === 'literal') return [];
  if (expression.kind === 'enumeration') return [expression.featureId];
  if (expression.kind === 'property')
    return [expression.featureId, ...planExpressionRefs(expression.object)];
  if (expression.kind === 'binary')
    return [...planExpressionRefs(expression.left), ...planExpressionRefs(expression.right)];
  return planExpressionRefs(expression.value);
}

const stable = (value: unknown): unknown =>
  value && typeof value === 'object'
    ? Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, item]) => [key, stable(item)])
      )
    : value;
export const samePlanExpression = (left: PlanExpression, right: PlanExpression) =>
  JSON.stringify(stable(normalizePlanExpression(left))) ===
  JSON.stringify(stable(normalizePlanExpression(right)));
