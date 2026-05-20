import fs from 'fs-extra';
import path from 'path';

const tmpTestFolder = path.resolve(process.cwd(), 'test/tmp');

try {
  fs.removeSync(tmpTestFolder);
} catch (error) {
  console.warn(`Unable to remove ${tmpTestFolder}: ${(error as Error).message}`);
}
