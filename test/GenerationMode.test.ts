import {routeGenerationEntry, validateGenerationMode} from '../src/app/service/generationBudget';

describe('Contract Gen mode boundaries', () => {
  test.each([
    ['linear', 'none'],
    ['feedback', 'generic'],
    ['feedback', 'full'],
  ] as const)('accepts %s/%s', (graphMode, feedbackMode) => {
    expect(() => validateGenerationMode(graphMode, feedbackMode)).not.toThrow();
  });

  test.each([
    ['linear', 'generic'],
    ['linear', 'full'],
    ['feedback', 'none'],
  ] as const)('rejects %s/%s', (graphMode, feedbackMode) => {
    expect(() => validateGenerationMode(graphMode, feedbackMode)).toThrow(
      'Inconsistent generation mode'
    );
  });

  test.each(['none', 'generic', 'full'] as const)(
    'paired/%s requires a frozen initial candidate',
    (feedbackMode) => {
      expect(() => validateGenerationMode('paired', feedbackMode, true)).not.toThrow();
      expect(() => validateGenerationMode('paired', feedbackMode, false)).toThrow(
        'Inconsistent generation mode'
      );
    }
  );

  test('a frozen candidate enters validation before any new generation', () => {
    expect(routeGenerationEntry(true)).toBe('seeded');
    expect(routeGenerationEntry(false)).toBe('generate');
  });
});
