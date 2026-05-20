import fs from 'fs-extra';
import path from 'path';
export const createGlobalEntryCode = () => {
  const publicDir = path.resolve(process.cwd(), 'public');
  return ['ArrayExtension', 'LogicFormulaBuilder', 'StandardOPs', 'PreconditionError']
    .map((f) => fs.readFileSync(path.resolve(publicDir, `${f}.ts`), 'utf-8'))
    .join('\n');
};
