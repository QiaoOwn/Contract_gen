import fs from 'fs-extra';
import path from 'path';
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

export const syncTestGlobalEntryCode = () => {
  const testDir = path.resolve(process.cwd(), 'test');
  const target = path.resolve(testDir, 'globalEntry.ts');
  const code = createGlobalEntryCode();
  fs.ensureDirSync(testDir);
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf-8') === code) {
    return target;
  }

  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, code, 'utf-8');
  fs.moveSync(temporary, target, {overwrite: true});
  return target;
};
