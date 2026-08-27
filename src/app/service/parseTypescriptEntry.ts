import fs from 'fs-extra';
import path from 'path';
import * as typescript from 'typescript';
import {createGlobalEntryCode} from './createGlobalEntryCode';

export const parseTypescriptEntry = (entry: string) => {
  const prefix = `baseline_eval/${new Date().getTime()}`;
  const entryFileName = `/${prefix}/entry/index.ts`;
  const globalEntryFileName = `/${prefix}/globalEntry.ts`;
  const dayjsFileName = `/${prefix}/dayjs.ts`;
  const compilerOptions: typescript.CompilerOptions = {
    target: typescript.ScriptTarget.ESNext,
    module: typescript.ModuleKind.ESNext,
    strict: true,
    noEmitOnError: false,
    lib: ['esnext'],
    allowJs: true,
    skipLibCheck: true,
    strictNullChecks: false,
    noEmit: true,
    esModuleInterop: true,
    moduleResolution: typescript.ModuleResolutionKind.Bundler,
    resolveJsonModule: true,
    isolatedModules: true,
    noImplicitAny: false,
    incremental: true,
    typeRoots: [path.join(process.cwd(), 'node_modules', '@types')],
    types: ['node'],
    paths: {
      dayjs: [dayjsFileName],
    },
  };
  const fileMap: Record<string, string> = {
    [entryFileName]: entry,
    [globalEntryFileName]: createGlobalEntryCode(),
    [dayjsFileName]: fs.readFileSync(`${process.cwd()}/node_modules/dayjs/index.d.ts`, 'utf-8'),
  };
  const fileNames = Object.keys(fileMap);
  const languageService = typescript.createLanguageService(
    {
      getScriptFileNames: () => fileNames,
      getScriptVersion: () => '1',
      getScriptSnapshot: (name) => {
        if (name in fileMap) {
          return typescript.ScriptSnapshot.fromString(fileMap[name]);
        }
        if (fs.existsSync(name)) {
          return typescript.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf-8'));
        }
        return undefined;
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: (options) => typescript.getDefaultLibFilePath(options),
      fileExists: (name) => fileMap[name] !== undefined || fs.existsSync(name),
      readFile: (name) =>
        fileMap[name] ?? (fs.existsSync(name) ? fs.readFileSync(name, 'utf-8') : undefined),
      readDirectory: (dir, extensions) => extensions?.map((ext) => `${dir}/file${ext}`) || [],
      directoryExists: () => true,
      getDirectories: () => [],
    },
    typescript.createDocumentRegistry()
  );
  const diagnostics = [
    ...languageService.getSyntacticDiagnostics(entryFileName),
    ...languageService.getSemanticDiagnostics(entryFileName),
  ];
  return diagnostics.map((diagnostic) => {
    if (diagnostic.file) {
      const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      return {
        line: line + 1,
        column: character + 1,
        msg: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        code: diagnostic.code,
      };
    }
    return {
      msg: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      code: diagnostic.code,
    };
  });
};
