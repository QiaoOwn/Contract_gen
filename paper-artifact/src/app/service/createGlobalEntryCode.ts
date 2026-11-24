import fs from 'fs-extra';
import path from 'path';
import {randomUUID} from 'node:crypto';
import {readInitialOptions} from 'jest-config';
export const createGlobalEntryCode = () => {
  const publicDir = path.resolve(process.cwd(), 'public');
  return [
    'ArrayExtension',
    'LogicFormulaBuilder',
    'StandardOPs',
    'PreconditionError',
    'PostconditionError',
    'OCLStateSnapshot',
    'OCLExecutionTrace',
  ]
    .map((f) => fs.readFileSync(path.resolve(publicDir, `${f}.ts`), 'utf-8'))
    .join('\n');
};

export const createIsolatedTestRuntime = async () => {
  const root = process.cwd();
  const target = path.resolve(root, 'test/tmp', `runtime-${randomUUID()}.ts`);
  const {config: base} = await readInitialOptions(path.resolve(root, 'jest.config.js'));
  fs.ensureDirSync(path.dirname(target));
  fs.writeFileSync(target, createGlobalEntryCode(), {flag: 'wx'});
  return {
    path: target,
    // Candidate and assertion helpers must share error-class identity without
    // replacing the frozen test/globalEntry.ts with a different runtime.
    config: JSON.stringify({
      ...base,
      rootDir: root,
      moduleNameMapper: {
        ...base.moduleNameMapper,
        '^(?:\\.\\.?/)+globalEntry(?:\\.ts)?$': target,
      },
    }),
    dispose: () => fs.removeSync(target),
  };
};
