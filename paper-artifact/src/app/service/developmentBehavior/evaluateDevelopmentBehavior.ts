import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createGlobalEntryCode} from '../createGlobalEntryCode';
import {developmentRegistry, validateDevelopmentReport, verifyDevelopmentSources} from './registry';
import type {DevelopmentBehaviorReport, DevelopmentOperation} from './types';

const execute = promisify(execFile);
export async function evaluateDevelopmentBehavior(
  entry: string,
  requirement: string,
  operation: string | DevelopmentOperation
): Promise<DevelopmentBehaviorReport> {
  const registration = developmentRegistry.require(operation);
  verifyDevelopmentSources(registration);
  const root = path.resolve('test/tmp');
  await fs.mkdir(root, {recursive: true});
  const temporary = await fs.mkdtemp(path.join(root, 'dev-repair-'));
  try {
    await fs.mkdir(path.join(temporary, 'entry'));
    const candidate = path.join(temporary, 'entry/candidate.ts');
    const output = path.join(temporary, 'report.json');
    const requirementFile = path.join(temporary, 'requirement.txt');
    await fs.writeFile(candidate, entry);
    await fs.writeFile(path.join(temporary, 'globalEntry.ts'), createGlobalEntryCode());
    await fs.writeFile(requirementFile, requirement);
    await execute(
      process.execPath,
      [
        '--import',
        'tsx',
        path.resolve('scripts/development_behavior_worker.ts'),
        candidate,
        output,
        requirementFile,
        registration.id,
      ],
      {cwd: process.cwd(), timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true}
    );
    return validateDevelopmentReport(JSON.parse(await fs.readFile(output, 'utf8')), registration);
  } finally {
    const relative = path.relative(root, await fs.realpath(temporary));
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      !relative.startsWith('dev-repair-')
    )
      throw new Error('Unsafe development temporary path');
    await fs.rm(temporary, {recursive: true, force: true});
  }
}
