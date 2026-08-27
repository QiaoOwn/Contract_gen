import {evaluateDefinition, PreconditionError} from '../public/PreconditionError';

describe('definition evaluation', () => {
  it('returns a successfully resolved binding', () => {
    expect(evaluateDefinition(() => 42)).toBe(42);
  });

  it('normalizes an invalid binding to PreconditionError', () => {
    expect(() =>
      evaluateDefinition(() => {
        throw new TypeError('cannot navigate an undefined source');
      })
    ).toThrow(PreconditionError);
  });
});
