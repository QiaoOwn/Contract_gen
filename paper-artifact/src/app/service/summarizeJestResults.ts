import {createEmptyTestResult, type AggregatedResult, type TestResult} from '@jest/test-result';

export const JEST_RESULT_SUMMARY_VERSION = 'jest-result-summary-v1';
export type SummarizedJestResult = TestResult & {
  summaryVersion: typeof JEST_RESULT_SUMMARY_VERSION;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  assertionResults: TestResult['testResults'];
  success: boolean;
};

export const summarizeJestResults = (
  results: AggregatedResult,
  expectedSuites: number
): SummarizedJestResult => {
  if (!Number.isInteger(expectedSuites) || expectedSuites < 1)
    throw new Error('Expected Jest suite count must be a positive integer');
  const suites = results.testResults;
  const assertions = suites.flatMap((suite) =>
    suite.testResults.map((assertion) => ({
      ...assertion,
      // Jest matcher details can retain cyclic domain objects; formatted failures carry the diagnostics.
      failureDetails: assertion.failureMessages,
    }))
  );
  const passing = suites.reduce((sum, suite) => sum + suite.numPassingTests, 0);
  const failing = suites.reduce((sum, suite) => sum + suite.numFailingTests, 0);
  const pending = suites.reduce((sum, suite) => sum + suite.numPendingTests, 0);
  const todo = suites.reduce((sum, suite) => sum + suite.numTodoTests, 0);
  const missingSuites = suites.length !== expectedSuites;
  const failed =
    missingSuites ||
    !results.success ||
    results.wasInterrupted ||
    Boolean(results.runExecError) ||
    results.numRuntimeErrorTestSuites > 0 ||
    results.numFailedTestSuites > 0 ||
    Boolean(results.snapshot.failure) ||
    suites.some(
      (suite) =>
        suite.numFailingTests > 0 ||
        suite.testExecError ||
        suite.failureMessage ||
        suite.leaks ||
        suite.snapshot.unmatched > 0
    ) ||
    assertions.some((assertion) => assertion.status === 'failed');
  const messages = [
    ...(missingSuites
      ? [`Expected ${expectedSuites} oracle suite(s), received ${suites.length}.`]
      : []),
    ...(results.wasInterrupted ? ['Jest execution was interrupted.'] : []),
    results.runExecError?.message,
    ...suites.flatMap((suite) => [
      suite.failureMessage,
      suite.testExecError?.message,
      ...(!suite.failureMessage
        ? suite.testResults.flatMap((assertion) => assertion.failureMessages)
        : []),
    ]),
  ].filter((message): message is string => Boolean(message));
  if (failed && !messages.length) messages.push('Jest reported an unsuccessful run.');
  return {
    ...(suites[0] || createEmptyTestResult()),
    summaryVersion: JEST_RESULT_SUMMARY_VERSION,
    numPassingTests: passing,
    numFailingTests: failing,
    numPendingTests: pending,
    numTodoTests: todo,
    testResults: assertions,
    assertionResults: assertions,
    testExecError:
      suites.find((suite) => suite.testExecError)?.testExecError || results.runExecError,
    failureMessage: messages.length ? [...new Set(messages)].join('\n') : null,
    leaks: suites.some((suite) => suite.leaks),
    skipped: suites.length > 0 && suites.every((suite) => suite.skipped),
    status: failed ? 'failed' : passing > 0 ? 'passed' : 'skipped',
    message: [...new Set(messages)].join('\n'),
    success: !failed && passing > 0,
  };
};
