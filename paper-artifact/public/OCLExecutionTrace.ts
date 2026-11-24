type OCLExecutionTraceEntry = {
  name: string;
  args: readonly unknown[];
  result?: unknown;
  error?: unknown;
};

const sameArguments = (left: readonly unknown[], right: readonly unknown[]) =>
  left.length === right.length && left.every((value, index) => Object.is(value, right[index]));

/** Records effectful calls so postcondition checking never invokes them twice. */
class OCLExecutionTrace {
  private readonly entries: OCLExecutionTraceEntry[] = [];

  call<T>(name: string, args: readonly unknown[], invoke: () => T): T {
    try {
      const result = invoke();
      this.entries.push({name, args: [...args], result});
      return result;
    } catch (error) {
      this.entries.push({name, args: [...args], error});
      throw error;
    }
  }

  wasCalled(name: string, args: readonly unknown[]): boolean {
    return this.entries.some(
      (entry) => entry.name === name && !entry.error && sameArguments(entry.args, args)
    );
  }

  getEntries(): readonly OCLExecutionTraceEntry[] {
    return this.entries.map((entry) => ({...entry, args: [...entry.args]}));
  }
}

export {OCLExecutionTrace, type OCLExecutionTraceEntry};
