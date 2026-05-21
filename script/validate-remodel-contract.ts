/**
 * Optional REMODEL Contract syntax check (exit 0 = valid).
 * Used only when baseline script is run with --validate-cmd.
 */
import fs from 'fs-extra';
import {parse} from '@/app/util';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: tsx script/validate-remodel-contract.ts <contract-file>');
  process.exit(2);
}

const {errors} = parse(fs.readFileSync(inputPath, 'utf-8'));
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
console.log('[]');
process.exit(0);
