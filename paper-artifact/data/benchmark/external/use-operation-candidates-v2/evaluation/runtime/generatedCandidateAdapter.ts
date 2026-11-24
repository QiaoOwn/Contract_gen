import generate from '@babel/generator';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';
import * as typescript from 'typescript';
import {Attribute} from '../../../../../../src/rm2pt/model/Attribute';
import {Entity} from '../../../../../../src/rm2pt/model/Entity';
import {Operation} from '../../../../../../src/rm2pt/model/Operation';
import {Parameter} from '../../../../../../src/rm2pt/model/Parameter';
import {Relationship} from '../../../../../../src/rm2pt/model/Relationship';
import {ReturnedType} from '../../../../../../src/rm2pt/model/ReturnedType';
import {Service} from '../../../../../../src/rm2pt/model/Service';
import {TempVariable} from '../../../../../../src/rm2pt/model/TempVariable';
import {
  generateTypescriptEntityFile,
  generateTypescriptServiceFile,
} from '../../../../../../src/app/service/generateTypescriptCode';
import {formatTypescript} from '../../../../../../src/app/util';
import {createGlobalEntryCode} from '../../../../../../src/app/service/createGlobalEntryCode';

export type ExternalGeneratedClauses = Readonly<{
  definition?: string | null;
  precondition: string;
  postcondition: string;
}>;

export type ExternalGenerationInput = Readonly<{
  id: string;
  project: string;
  context_type: string;
  operation_name: string;
  operation_signature: string;
  description: string;
}>;

type AttributeSpec = Readonly<{name: string; type: string}>;
type RelationshipSpec = Readonly<{name: string; type: string}>;
type EntitySpec = Readonly<{
  name: string;
  extends?: string;
  attributes?: readonly AttributeSpec[];
  relationships?: readonly RelationshipSpec[];
}>;
type ModelSpec = Readonly<{entities: readonly EntitySpec[]}>;

const MODEL_SPECS: Readonly<Record<string, ModelSpec>> = {
  Employee: {
    entities: [
      {
        name: 'Person',
        attributes: [
          {name: 'name', type: 'String'},
          {name: 'age', type: 'Integer'},
          {name: 'salary', type: 'Real'},
        ],
        relationships: [{name: 'employer', type: 'Company'}],
      },
      {
        name: 'Company',
        attributes: [
          {name: 'name', type: 'String'},
          {name: 'location', type: 'String'},
        ],
        relationships: [{name: 'employee', type: 'Set(Person)'}],
      },
    ],
  },
  Graph: {
    entities: [
      {
        name: 'Node',
        relationships: [
          {name: 'source', type: 'Set(Node)'},
          {name: 'target', type: 'Set(Node)'},
        ],
      },
    ],
  },
  CivilStatusWorld: {
    entities: [
      {
        name: 'Person',
        attributes: [
          {name: 'name', type: 'String'},
          {name: 'civstat', type: 'CivilStatus[single|married|divorced|widowed]'},
          {name: 'gender', type: 'Gender[female|male]'},
          {name: 'alive', type: 'Boolean'},
        ],
        relationships: [
          {name: 'wife', type: 'Person'},
          {name: 'husband', type: 'Person'},
        ],
      },
    ],
  },
  ProjectWorld: {
    entities: [
      {
        name: 'Company',
        attributes: [{name: 'name', type: 'String'}],
        relationships: [
          {name: 'employees', type: 'Set(Worker)'},
          {name: 'projects', type: 'Set(Project)'},
        ],
      },
      {
        name: 'Worker',
        attributes: [
          {name: 'nickname', type: 'String'},
          {name: 'salary', type: 'Integer'},
        ],
        relationships: [
          {name: 'employer', type: 'Company'},
          {name: 'projects', type: 'Set(Project)'},
          {name: 'qualifications', type: 'Set(Qualification)'},
        ],
      },
      {
        name: 'Project',
        attributes: [
          {name: 'name', type: 'String'},
          {name: 'size', type: 'ProjectSize[small|medium|big]'},
          {name: 'status', type: 'ProjectStatus[planned|active|finished|suspended]'},
        ],
        relationships: [
          {name: 'company', type: 'Company'},
          {name: 'members', type: 'Set(Worker)'},
          {name: 'requirements', type: 'Set(Qualification)'},
          {name: 'predecessors', type: 'Set(Project)'},
          {name: 'successors', type: 'Set(Project)'},
        ],
      },
      {
        name: 'Qualification',
        attributes: [{name: 'description', type: 'String'}],
        relationships: [
          {name: 'workers', type: 'Set(Worker)'},
          {name: 'projects', type: 'Set(Project)'},
        ],
      },
      {name: 'Training', extends: 'Project'},
    ],
  },
  TollCollect: {
    entities: [
      {
        name: 'Truck',
        attributes: [
          {name: 'num', type: 'String'},
          {name: 'debt', type: 'Integer'},
        ],
        relationships: [
          // The external adapter uses the existing collection-navigation lowering so the
          // generated runtime preserves the ordered values in its array representation.
          {name: 'trips', type: 'Set(Point)'},
          {name: 'point', type: 'Point'},
        ],
      },
      {
        name: 'Point',
        attributes: [{name: 'name', type: 'String'}],
        relationships: [
          {name: 'north', type: 'Set(Point)'},
          {name: 'south', type: 'Set(Point)'},
        ],
      },
    ],
  },
};

const toEntities = (spec: ModelSpec): Record<string, Entity> => {
  const result: Record<string, Entity> = {};
  for (const entitySpec of spec.entities) {
    result[entitySpec.name] = new Entity({
      name: entitySpec.name,
      description: `USE external model entity ${entitySpec.name}.`,
      attributes: (entitySpec.attributes || []).map(
        ({name, type}) => new Attribute({name, type, description: ''})
      ),
      relationships: (entitySpec.relationships || []).map(
        ({name, type}) =>
          new Relationship({
            name,
            relatedEntity: type,
            associationType: 'Association',
            description: '',
          })
      ),
    });
  }
  for (const entitySpec of spec.entities) {
    if (entitySpec.extends) result[entitySpec.name].extends = result[entitySpec.extends];
  }
  return result;
};

const splitParameters = (value: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '(') depth += 1;
    if (value[index] === ')') depth -= 1;
    if (value[index] === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  const final = value.slice(start).trim();
  if (final) parts.push(final);
  return parts;
};

export const parseExternalOperationSignature = (signature: string) => {
  const match = signature.match(/^\s*([A-Za-z_]\w*)::([A-Za-z_]\w*)\((.*)\)\s*(?::\s*(.+?))?\s*$/);
  if (!match) throw new Error(`Unsupported external operation signature: ${signature}`);
  const [, contextType, operationName, parameterText, returnTypeText] = match;
  const parameters = splitParameters(parameterText).map((parameter) => {
    const separator = parameter.indexOf(':');
    if (separator < 1) throw new Error(`Invalid parameter in signature ${signature}: ${parameter}`);
    return {
      name: parameter.slice(0, separator).trim(),
      type: parameter.slice(separator + 1).trim(),
    };
  });
  return {
    contextType,
    operationName,
    parameters,
    returnType: returnTypeText?.trim() || undefined,
  };
};

const contextFields = (spec: ModelSpec, contextType: string) => {
  const entity = spec.entities.find((candidate) => candidate.name === contextType);
  if (!entity) throw new Error(`Unknown external context type ${contextType}`);
  return [...(entity.attributes || []), ...(entity.relationships || [])];
};

export const createExternalCandidateEntryCode = async (
  input: ExternalGenerationInput,
  clauses: ExternalGeneratedClauses
) => {
  const model = MODEL_SPECS[input.project];
  if (!model) throw new Error(`Unknown USE external project ${input.project}`);
  const signature = parseExternalOperationSignature(input.operation_signature);
  if (
    signature.contextType !== input.context_type ||
    signature.operationName !== input.operation_name
  ) {
    throw new Error(`Operation metadata disagrees with signature for ${input.id}`);
  }

  const operation = new Operation({
    name: signature.operationName,
    description: input.description,
    parameters: signature.parameters.map((parameter) => new Parameter(parameter)),
    returnType: signature.returnType ? new ReturnedType(signature.returnType) : undefined,
    definition: clauses.definition || undefined,
    precondition: clauses.precondition,
    postcondition: clauses.postcondition,
  });
  const serviceName = `External${signature.contextType}ContractContext`;
  const service = new Service({
    name: serviceName,
    operations: [operation],
    tempVariables: contextFields(model, signature.contextType).map(
      (field) => new TempVariable({name: field.name, type: field.type})
    ),
  });
  const entities = toEntities(model);
  const entityFile = generateTypescriptEntityFile(entities, service);
  const {file: serviceFile, counter} = generateTypescriptServiceFile(service, [operation]);
  const serviceClass = serviceFile.program.body.find(
    (node): node is t.ClassDeclaration =>
      t.isClassDeclaration(node) && node.id?.name === serviceName
  );
  if (!serviceClass) throw new Error(`Generated service class ${serviceName} was not found`);
  serviceClass.superClass = t.identifier(signature.contextType);
  const inheritedFields = new Set(
    contextFields(model, signature.contextType).map((field) => field.name)
  );
  serviceClass.body.body = serviceClass.body.body.filter(
    (member) =>
      !(
        t.isClassProperty(member) &&
        t.isIdentifier(member.key) &&
        inheritedFields.has(member.key.name)
      )
  );
  const entityCode = await formatTypescript(generate(entityFile).code);
  const serviceCode = await formatTypescript(generate(serviceFile).code);
  const entry = [
    'import dayjs from "dayjs";',
    'import {evaluateDefinition, evaluatePrecondition, evaluateEffect, l, OCLExecutionTrace, OCLStateSnapshot, PostconditionError, PreconditionError, StandardOPs} from "../globalEntry";',
    entityCode,
    serviceCode,
  ].join('\n\n');
  return {
    entry,
    entityCode,
    serviceCode,
    serviceName,
    operationName: signature.operationName,
    counter,
  };
};

export type ExternalTypescriptDiagnostic = Readonly<{
  line: number;
  column: number;
  code: number;
  msg: string;
}>;

export const checkExternalCandidateEntry = (entry: string): ExternalTypescriptDiagnostic[] => {
  const prefix = `use_external/${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
    paths: {dayjs: [dayjsFileName]},
  };
  const fileMap: Record<string, string> = {
    [entryFileName]: entry,
    [globalEntryFileName]: createGlobalEntryCode(),
    [dayjsFileName]: fs.readFileSync(
      path.resolve(process.cwd(), 'node_modules/dayjs/index.d.ts'),
      'utf-8'
    ),
  };
  const languageService = typescript.createLanguageService(
    {
      getScriptFileNames: () => Object.keys(fileMap),
      getScriptVersion: () => '1',
      getScriptSnapshot: (name) => {
        if (name in fileMap) return typescript.ScriptSnapshot.fromString(fileMap[name]);
        if (fs.existsSync(name)) {
          return typescript.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf-8'));
        }
        return undefined;
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: (options) => typescript.getDefaultLibFilePath(options),
      fileExists: (fileName) => fileMap[fileName] !== undefined || fs.existsSync(fileName),
      readFile: (fileName) => {
        if (fileName in fileMap) return fileMap[fileName];
        try {
          return fs.readFileSync(fileName, 'utf-8');
        } catch {
          return undefined;
        }
      },
      readDirectory: (directory, extensions) =>
        extensions?.map((extension) => `${directory}/file${extension}`) || [],
      directoryExists: () => true,
      getDirectories: () => [],
    },
    typescript.createDocumentRegistry()
  );
  return [
    ...languageService.getSyntacticDiagnostics(entryFileName),
    ...languageService.getSemanticDiagnostics(entryFileName),
  ].map((diagnostic) => {
    const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start || 0);
    return {
      line: (position?.line || 0) + 1,
      column: (position?.character || 0) + 1,
      code: diagnostic.code,
      msg: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    };
  });
};
