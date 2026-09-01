// Compare entity membership by identity, not array identity, order or deep shape.
export function expectSameMembers<T>(actual: readonly T[], expected: readonly T[]): void {
  expect(Array.isArray(actual)).toBe(true);
  expect(actual).toHaveLength(expected.length);
  for (const member of expected) expect(actual).toContain(member);
  for (const member of actual) expect(expected).toContain(member);
  expect(new Set(actual).size).toBe(new Set(expected).size);
}
