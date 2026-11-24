export type PilotArm = 'ordinary' | 'dependency-guided';
export type PilotOutcome = {
  infrastructureUnknown?: boolean;
  protocolAccepted: boolean;
  permissionPassed: boolean;
  preexecValid: boolean;
  unchangedRounds: number;
  cycle: boolean;
};

// Both arms must use this same policy; a response never grants another budget slot.
export function pilotStop(outcome: PilotOutcome): string | null {
  if (outcome.infrastructureUnknown) return 'infrastructure-unknown-stop';
  if (!outcome.protocolAccepted) return 'protocol-invalid';
  if (!outcome.permissionPassed) return 'unauthorized-edit';
  if (outcome.preexecValid) return 'preexec-valid';
  if (outcome.cycle) return 'cycle';
  if (outcome.unchangedRounds >= 2) return 'stagnation';
  return null;
}

export class PilotBudget {
  readonly counts: Record<PilotArm, number> = {ordinary: 0, 'dependency-guided': 0};
  readonly pending = new Set<PilotArm>();
  readonly stopped = new Set<PilotArm>();
  constructor(readonly priorSlots = 1, readonly perArm = 2, readonly pairCap = 4) {
    if (!Number.isInteger(priorSlots) || priorSlots < 0 || !Number.isInteger(perArm) || perArm < 1 ||
      priorSlots + perArm > 5 || pairCap !== 2 * perArm || pairCap > 4) throw new Error('Invalid pilot budget');
  }
  reserve(arm: PilotArm) {
    if (this.stopped.has(arm) || this.pending.has(arm)) throw new Error('Arm stopped or response state unknown');
    if (this.counts[arm] >= this.perArm || this.counts.ordinary + this.counts['dependency-guided'] >= this.pairCap) {
      throw new Error('Pilot budget exhausted');
    }
    this.counts[arm]++;
    this.pending.add(arm);
  }
  complete(arm: PilotArm, outcome: PilotOutcome) {
    if (!this.pending.delete(arm)) throw new Error('No reserved call');
    const stop = pilotStop(outcome);
    if (stop || this.counts[arm] >= this.perArm) this.stopped.add(arm);
    return stop ?? (this.stopped.has(arm) ? 'budget-exhausted' : null);
  }
}
