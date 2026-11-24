import type {Service} from '@/rm2pt/model/Service';

export type ResolvedServiceState = Readonly<{name: string; type: string}>;

export const resolveServiceState = (
  service: Pick<Service, 'name' | 'tempVariables'>,
  systemService?: Pick<Service, 'name' | 'tempVariables'>
): ResolvedServiceState[] => {
  const byName = new Map<string, ResolvedServiceState>();
  for (const source of [service, systemService]) {
    for (const variable of source?.tempVariables || []) {
      const existing = byName.get(variable.name);
      if (existing && existing.type !== variable.type) {
        throw new Error(
          `Conflicting service state ${variable.name}: ${existing.type} vs ${variable.type}`
        );
      }
      if (!existing) byName.set(variable.name, {name: variable.name, type: variable.type});
    }
  }
  return [...byName.values()];
};
