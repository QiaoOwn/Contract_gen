import {PreconditionError} from '../globalEntry';

/**
 * Shared helpers for Contract Gen execution oracles.
 *
 * Each operation suite is expected to cover:
 * 1. Happy path — assert return value and post-state obligations.
 * 2. Precondition rejection — at least one violating call throws PreconditionError
 *    without applying post-state effects (when a non-vacuous precondition exists).
 * 3. Alternate outcomes — return-false / if-then branches when the requirement
 *    states more than one successful post-state.
 */

export const clearRepositories = (...repositories: unknown[][]) => {
  for (const repository of repositories) {
    repository.splice(0, repository.length);
  }
};

export const expectPreconditionRejected = (action: () => unknown) => {
  expect(action).toThrow(PreconditionError);
};

export const expectUnchangedLength = (repository: unknown[], expectedLength: number) => {
  expect(repository).toHaveLength(expectedLength);
};

export const snapshotService = <T extends object>(service: T, keys: readonly (keyof T)[]) => {
  const snapshot = {} as Record<string, unknown>;
  for (const key of keys) {
    snapshot[String(key)] = service[key];
  }
  return snapshot;
};

export const expectServiceSnapshot = <T extends object>(
  service: T,
  keys: readonly (keyof T)[],
  expected: Record<string, unknown>
) => {
  expect(snapshotService(service, keys)).toEqual(expected);
};
