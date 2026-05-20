import fs from 'fs-extra';
import path from 'path';
export const createG4Prompt = () => {
  const remodelG4 = fs.readFileSync(path.resolve(process.cwd(), 'antlr4/REMODEL.g4')).toString();
  return [
    'You are a contract code generator, the code antlr4 rules in the below, you should just focus on definition, precondition and postcondition part:',
    remodelG4,
  ].join('\n');
};
