import {OCLExecutionTrace} from '../public/OCLExecutionTrace';
import {PostconditionError} from '../public/PostconditionError';

describe('OCLExecutionTrace', () => {
  test('records an effectful call and returns its result', () => {
    const trace = new OCLExecutionTrace();
    const argument = {id: 1};
    const effect = jest.fn(() => true);

    expect(trace.call('notify', [argument], effect)).toBe(true);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(trace.wasCalled('notify', [argument])).toBe(true);
    expect(trace.wasCalled('notify', [{id: 1}])).toBe(false);
  });

  test('does not accept failed calls as satisfied postcondition effects', () => {
    const trace = new OCLExecutionTrace();
    const failure = new Error('unavailable');

    expect(() =>
      trace.call('notify', [], () => {
        throw failure;
      })
    ).toThrow(failure);
    expect(trace.wasCalled('notify', [])).toBe(false);
    expect(trace.getEntries()[0].error).toBe(failure);
  });

  test('returns defensive copies of trace entries', () => {
    const trace = new OCLExecutionTrace();
    trace.call('notify', ['user'], () => undefined);

    const entries = trace.getEntries();
    (entries[0].args as unknown[]).push('mutated');

    expect(trace.wasCalled('notify', ['user'])).toBe(true);
  });

  test('uses a distinct error type for postcondition failures', () => {
    const error = new PostconditionError('(balance mismatch)');

    expect(error.name).toBe('PostconditionError');
    expect(error.message).toContain('Postcondition validation failed');
  });
});
