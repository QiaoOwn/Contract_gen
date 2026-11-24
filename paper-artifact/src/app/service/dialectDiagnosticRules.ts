export const DIALECT_DIAGNOSTIC_RULES = {
  DIA_AGGREGATE_BINDING: {
    ruleIds: ['G-SYN-04', 'G-QRY-04', 'G-SEM-08'],
    action: 'repair-candidate',
    meaning: 'Projection/reduction requires exactly one typed, uninitialized iterator.',
  },
  DIA_AGGREGATE_EFFECT: {
    ruleIds: ['G-QRY-04', 'G-SEM-08'],
    action: 'repair-candidate',
    meaning: 'Projection/reduction selectors are pure queries; object creation is forbidden.',
  },
  DIA_OPERATION_CALL_UNSUPPORTED: {
    ruleIds: ['G-SEM-04'],
    action: 'review-capability',
    meaning: 'Callable operation semantics are not supplied.',
  },
  DIA_COLLECT_UNSUPPORTED: {
    ruleIds: ['G-SEM-01', 'G-SEM-08'],
    action: 'review-capability',
    meaning:
      'Bag-producing collect is outside the generated subset; do not assume a Set rewrite is equivalent.',
  },
  DIA_REPOSITORY_SPELLING: {
    ruleIds: ['G-SYN-02'],
    action: 'repair-candidate',
    meaning: 'Use allInstances instead of the parser-only spelling.',
  },
  DIA_RESULT_SCOPE: {
    ruleIds: ['G-EFF-07'],
    action: 'repair-candidate',
    meaning: 'result belongs only in the postcondition.',
  },
  DIA_RESULT_WITHOUT_RETURN: {
    ruleIds: ['G-EFF-07'],
    action: 'repair-candidate',
    meaning: 'The signature has no result value.',
  },
  DIA_PRESTATE_SCOPE: {
    ruleIds: ['G-TMP-01'],
    action: 'repair-candidate',
    meaning: '@pre belongs only in the postcondition.',
  },
  DIA_NEWNESS_SCOPE: {
    ruleIds: ['G-QRY-05'],
    action: 'repair-candidate',
    meaning: 'Newness effects belong only in the postcondition.',
  },
  DIA_DEFINITION_BINDING: {
    ruleIds: ['G-SYN-04'],
    action: 'repair-candidate',
    meaning: 'Definition bindings need a type and initializer.',
  },
  DIA_ITERATOR_BINDING: {
    ruleIds: ['G-SYN-04'],
    action: 'repair-candidate',
    meaning: 'Iterator bindings need a type and no initializer.',
  },
  DIA_LET_BINDING: {
    ruleIds: ['G-SYN-04'],
    action: 'repair-candidate',
    meaning: 'Let bindings need an explicit type.',
  },
} as const;
export type DialectDiagnosticCode = keyof typeof DIALECT_DIAGNOSTIC_RULES;
export const dialectDiagnosticRule = (code: unknown) =>
  Object.hasOwn(DIALECT_DIAGNOSTIC_RULES, String(code))
    ? DIALECT_DIAGNOSTIC_RULES[String(code) as DialectDiagnosticCode]
    : undefined;
