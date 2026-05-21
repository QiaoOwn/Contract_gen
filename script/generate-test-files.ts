import {C2TCounter} from '@/app/ContractToTypescript';
import {buildEntryCode} from '@/app/service/createEntryCode';
import {createGlobalEntryCode} from '@/app/service/createGlobalEntryCode';
import getOperationCode from '@/app/service/getOperationCode';
import {UseCaseKeys} from '@/app/type';
import {formatTypescript} from '@/app/util';
import * as allProjects from '@/rm2pt/project';
import fs from 'fs-extra';
import path from 'path';

type CounterBucket = Record<string, number> & {total: number};
type CounterSummary = Record<string, CounterBucket>;
type CounterPercentSummary = Record<string, Record<string, string>>;

(async function main() {
  const promises: ReturnType<typeof getOperationCode>[] = [];
  Object.entries(allProjects).forEach(([p, {useCase}]) => {
    const project = p as keyof typeof allProjects;
    Object.entries(useCase).forEach(
      ([
        uc,
        {
          relatedService: {operations},
        },
      ]) => {
        promises.push(
          ...operations.map(({name}) => {
            const useCase = uc as UseCaseKeys;
            return getOperationCode({project, useCase, operation: name, removeExports: false});
          })
        );
      }
    );
  });
  const files = await Promise.all(promises);
  const testDir = path.resolve(process.cwd(), 'test');
  const publicDir = path.resolve(process.cwd(), 'public');
  fs.ensureDirSync(testDir);
  fs.writeJSONSync(
    path.resolve(testDir, 'tsconfig.json'),
    {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strictNullChecks: false,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        noImplicitAny: false,
        incremental: true,
      },
    },
    {spaces: 2}
  );
  const globalEntryFile = path.resolve(testDir, 'globalEntry.ts');
  fs.ensureFileSync(globalEntryFile);
  fs.writeFileSync(globalEntryFile, createGlobalEntryCode());
  const counter: CounterSummary = {};
  const expressions: string[] = [];
  await Promise.all(
    files.map(
      async ({typescript, projectName, serviceName, operationName, fileKey, c2tCounter}) => {
        Object.entries(c2tCounter).forEach(([oclExpressionType, expressionMap]) => {
          if (!counter[oclExpressionType as keyof C2TCounter]) {
            counter[oclExpressionType] = {total: 0};
          }
          expressions.push(...c2tCounter.expressions);
          let totalAdd = false;
          Object.entries(expressionMap).forEach(([key, expressionCount]) => {
            if (expressionCount > 0) {
              if (!totalAdd) {
                counter[oclExpressionType].total++;
                totalAdd = true;
              }
              const c = counter[oclExpressionType];
              if (!c[key]) {
                c[key] = 1;
              }
              c[key]++;
            }
          });
        });
        console.log(`Generating test file for ${fileKey}`);
        const dir = path.resolve(testDir, fileKey);
        const entryFile = path.resolve(dir, `entry.ts`);
        const testFile = path.resolve(dir, `index.test.ts`);
        fs.ensureDirSync(dir);
        fs.ensureFileSync(entryFile);
        fs.writeFileSync(entryFile, buildEntryCode(typescript), 'utf-8');
        if (!fs.existsSync(testFile)) {
          fs.ensureFileSync(testFile);
          fs.writeFileSync(
            testFile,
            await formatTypescript(
              `import {${serviceName}} from './entry';
        describe('${projectName}/${serviceName}/${operationName}', () => {
        it('Happy Path', () => {
          const service=new ${serviceName};
          const result=service.${operationName}();
          expect(result).toBe(true);
            });
           });`
            ),
            'utf-8'
          );
        }
      }
    )
  );
  const total = files.length;
  const newCounter = Object.entries(counter).reduce<CounterPercentSummary>(
    (prev, [oclExpressionType, expressionMap]) => {
      const key = `${oclExpressionType}Percent`;
      if (!prev[key]) {
        prev[key] = {};
      }
      Object.entries(expressionMap).forEach(([k, expressionCount]) => {
        prev[key][k] = ((expressionCount / total) * 100).toFixed(2);
      });
      return prev;
    },
    {}
  );
  const C2TExpression = expressions;
  const expressionCount = C2TExpression.length;
  fs.writeJsonSync(path.resolve(publicDir, `C2TExpressionCounter.json`), {
    ...counter,
    ...newCounter,
    expressionCount,
    total,
  });
  fs.writeJsonSync(path.resolve(publicDir, `C2TExpression.json`), C2TExpression);
})();
