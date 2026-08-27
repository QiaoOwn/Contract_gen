import * as t from '@babel/types';
import {Entity} from '@/rm2pt/model/Entity';
import {Service} from '@/rm2pt/model/Service';
import {Operation} from '@/rm2pt/model/Operation';
import {ContractToTypescript} from '../ContractToTypescript';
import {tsTypeMap, tsTypeMapCode} from '../constant';
import {getTypescriptType} from '../util';

const createIIFE = (statements: t.Statement[]) =>
  t.callExpression(t.arrowFunctionExpression([], t.blockStatement(statements)), []);

const returnFullBuildResult = (statements: t.Statement[]) => {
  const finalStatement = statements.at(-1);
  if (!t.isReturnStatement(finalStatement) || !finalStatement.argument) {
    throw new Error('Postcondition lowering must end with a return statement');
  }
  if (
    !t.isMemberExpression(finalStatement.argument) ||
    !t.isCallExpression(finalStatement.argument.object)
  ) {
    throw new Error('Postcondition check must return a LogicFormulaBuilder result');
  }
  finalStatement.argument = finalStatement.argument.object;
  return statements;
};

export const generateTypescriptEntityFile = (entity: {[key: string]: Entity}, service: Service) => {
  const enumMap: {[key: string]: t.TSEnumDeclaration} = {};
  const tempVariables = service.tempVariables || [];
  const systemVariables = service.useCase?.systemService.tempVariables || [];
  [...tempVariables, ...systemVariables].map((e) => {
    if (e.type.includes('[')) {
      const [name, valuesString] = e.type.split('[');
      if (!(name in enumMap)) {
        enumMap[name] = t.tsEnumDeclaration(
          t.identifier(name),
          valuesString
            .replace('[', '')
            .replace(']', '')
            .split('|')
            .map((item: string) => t.tsEnumMember(t.identifier(item), t.stringLiteral(item)))
        );
      }
    }
  });
  const entities = Object.values(entity);
  const body = entities.map((e) => {
    const classAttributeBody = e.attributes.map((attr) => {
      let tsTypeAnnotation: t.TSType;
      if (attr.type in tsTypeMap) {
        tsTypeAnnotation = tsTypeMap[attr.type as keyof typeof tsTypeMap];
      } else if (attr.type.includes('[')) {
        const [name, valuesString] = attr.type.split('[');
        if (!(name in enumMap)) {
          enumMap[name] = t.tsEnumDeclaration(
            t.identifier(name),
            valuesString
              .replace('[', '')
              .replace(']', '')
              .split('|')
              .map((item: string) => t.tsEnumMember(t.identifier(item), t.stringLiteral(item)))
          );
        }
        tsTypeAnnotation = t.tsTypeReference(t.identifier(name));
      }
      const classProperty = t.classProperty(
        t.identifier(attr.name),
        null,
        t.tsTypeAnnotation(tsTypeAnnotation!)
      );
      if (attr.description) {
        t.addComments(classProperty, 'leading', [{value: attr.description, type: 'CommentBlock'}]);
      }
      return classProperty;
    });
    const classRelationshipBody = (e.relationships || []).map((rel) => {
      const classProperty = t.classProperty(
        t.identifier(rel.name),
        null,
        getTypescriptType(rel.relatedEntity)
      );
      if (rel.description) {
        t.addComments(classProperty, 'leading', [{value: rel.description, type: 'CommentBlock'}]);
      }
      return classProperty;
    });
    const classDeclaration = t.classDeclaration(
      t.identifier(e.name),
      e.extends ? t.identifier(e.extends.name) : null,
      t.classBody([...classAttributeBody, ...classRelationshipBody])
    );
    if (e.description) {
      t.addComments(classDeclaration, 'leading', [{value: e.description, type: 'CommentBlock'}]);
    }
    return classDeclaration;
  });
  const mapDeclaration = t.variableDeclarator(t.identifier('map'));
  mapDeclaration.init = t.newExpression(t.identifier('Map'), []);
  const getRepositoryDeclaration = t.variableDeclarator(t.identifier('getRepository'));
  const clazzIdentifier = t.identifier('clazz');
  const restElement = t.restElement(t.identifier('args'));
  restElement.typeAnnotation = t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword()));
  clazzIdentifier.typeAnnotation = t.tsTypeAnnotation(
    t.tsConstructorType(
      null,
      [restElement],
      t.tsTypeAnnotation(t.tsTypeReference(t.identifier('T')))
    )
  );
  const getRepositoryDeclarationInit = t.arrowFunctionExpression(
    [clazzIdentifier],
    t.blockStatement([
      t.returnStatement(
        t.tsAsExpression(
          t.callExpression(t.memberExpression(t.identifier('map'), t.identifier('get')), [
            t.identifier('clazz'),
          ]),
          t.tsArrayType(t.tsTypeReference(t.identifier('T')))
        )
      ),
    ])
  );
  getRepositoryDeclarationInit.typeParameters = t.tsTypeParameterDeclaration([
    t.tsTypeParameter(undefined, undefined, 'T'),
  ]);

  getRepositoryDeclaration.init = getRepositoryDeclarationInit;
  const program = t.program([
    ...body,
    ...Object.values(enumMap),
    t.variableDeclaration('const', [mapDeclaration]),
    ...entities.map((e) => {
      return t.expressionStatement(
        t.callExpression(t.memberExpression(t.identifier('map'), t.identifier('set')), [
          t.identifier(e.name),
          t.arrayExpression(),
        ])
      );
    }),
    t.variableDeclaration('const', [getRepositoryDeclaration]),
    t.exportNamedDeclaration(null, [
      ...Object.keys({...enumMap, ...entity}).map((key) =>
        t.exportSpecifier(t.identifier(key), t.identifier(key))
      ),
      t.exportSpecifier(t.identifier('getRepository'), t.identifier('getRepository')),
    ]),
  ]);
  const file = t.file(program);
  return file;
};

export const generateTypescriptServiceFile = (service: Service, operations: Operation[] = []) => {
  const temporalIdentifier = 'oclInvocationTime';
  const c2t = new ContractToTypescript({loweringMode: 'execute', temporalIdentifier});
  const postconditionChecker = new ContractToTypescript({
    loweringMode: 'check',
    temporalIdentifier,
  });
  const ops = operations || service.operations;
  const tempVariables = service.tempVariables;
  const isSystemService = service.name === service.useCase?.systemService.name;
  const classProperties: t.ClassProperty[] = [];
  const systemVariables = service.useCase?.systemService.tempVariables;
  if (systemVariables?.length) {
    systemVariables.forEach((variable) => {
      classProperties.push(
        t.classProperty(t.identifier(variable.name), null, getTypescriptType(variable.type))
      );
    });
    t.addComments(classProperties[0], 'leading', [
      {value: `SystemVariable Start`, type: 'CommentBlock'},
    ]);
    t.addComments(classProperties.at(-1)!, 'trailing', [
      {value: `SystemVariable End`, type: 'CommentBlock'},
    ]);
  }
  if (tempVariables?.length && !isSystemService) {
    const currentLength = classProperties.length;
    tempVariables.forEach((variable) => {
      classProperties.push(
        t.classProperty(t.identifier(variable.name), null, getTypescriptType(variable.type))
      );
    });
    t.addComments(classProperties[currentLength], 'leading', [
      {value: `TempVariable Start`, type: 'CommentBlock'},
    ]);
    t.addComments(classProperties.at(-1)!, 'trailing', [
      {value: `TempVariable End`, type: 'CommentBlock'},
    ]);
  }
  const operationsBody = ops.map((op: Operation) => {
    const classBody: t.Statement[] = [];
    const usesTemporalEnvironment = /\b(?:Today|Now)\b/.test(
      [op.definition, op.precondition, op.postcondition].filter(Boolean).join('\n')
    );
    if (usesTemporalEnvironment) {
      const temporalCapture = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(temporalIdentifier),
          t.callExpression(t.identifier('dayjs'), [])
        ),
      ]);
      t.addComments(temporalCapture, 'leading', [
        {value: `OCL Invocation Environment`, type: 'CommentBlock'},
      ]);
      classBody.push(temporalCapture);
    }
    let vars = (op.parameters || []).map((v) => ({name: v.name, type: v.type}));
    const tempVars = tempVariables?.map((t) => ({name: t.name, type: t.type})) || [];
    const systemVars = systemVariables?.map((t) => ({name: t.name, type: t.type})) || [];
    const globalVars = !isSystemService ? tempVars.concat(systemVars) : systemVars;
    let definitionPart: t.Statement[] = [];
    if (op.definition) {
      definitionPart = c2t.transform(`definition:\n${op.definition}`, 'Definition', {
        vars,
        globalVars,
      }) as t.Statement[];
      definitionPart.forEach((statement) => {
        if (!t.isVariableDeclaration(statement)) {
          return;
        }
        statement.declarations.forEach((declaration) => {
          if (!declaration.init) {
            return;
          }
          declaration.init = t.callExpression(t.identifier('evaluateDefinition'), [
            t.arrowFunctionExpression([], declaration.init),
          ]);
        });
      });
      t.addComments(definitionPart[0], 'leading', [
        {value: `Definition Start`, type: 'CommentBlock'},
      ]);
      t.addComments(definitionPart.at(-1)!, 'trailing', [
        {value: `Definition End`, type: 'CommentBlock'},
      ]);
      classBody.push(...definitionPart);
    }
    vars = definitionPart
      .map((d) => {
        const identifier = ((d as t.VariableDeclaration).declarations[0] as t.VariableDeclarator)
          .id as t.Identifier;
        let type: string;
        const {typeAnnotation} = identifier.typeAnnotation as t.TSTypeAnnotation;
        if (t.isTSTypeReference(typeAnnotation)) {
          type = ((typeAnnotation as t.TSTypeReference).typeName as t.Identifier).name;
        } else {
          type = tsTypeMapCode[typeAnnotation.type as keyof typeof tsTypeMapCode];
        }
        return {
          name: identifier.name,
          type,
        };
      })
      .concat(vars);

    const preconditionPart = c2t.transform(`precondition:\n${op.precondition}`, 'Precondition', {
      vars,
      globalVars,
    }) as t.Statement[];

    t.addComments(preconditionPart[0], 'leading', [
      {value: `Precondition Start`, type: 'CommentBlock'},
    ]);
    t.addComments(preconditionPart.at(-1)!, 'trailing', [
      {value: `Precondition End`, type: 'CommentBlock'},
    ]);
    classBody.push(...preconditionPart);

    const stateSnapshot = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(c2t.stateIdentifier),
        t.newExpression(t.identifier('OCLStateSnapshot'), [
          t.identifier('map'),
          t.arrayExpression([t.thisExpression()]),
        ])
      ),
    ]);
    t.addComments(stateSnapshot, 'leading', [
      {value: `OCL Pre-state Snapshot`, type: 'CommentBlock'},
    ]);
    classBody.push(stateSnapshot);

    const executionTrace = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(c2t.traceIdentifier),
        t.newExpression(t.identifier('OCLExecutionTrace'), [])
      ),
    ]);
    t.addComments(executionTrace, 'leading', [{value: `OCL Effect Trace`, type: 'CommentBlock'}]);
    classBody.push(executionTrace);

    const postconditionEffects = c2t.transform(
      `postcondition:\n${op.postcondition}`,
      'Postcondition',
      {
        vars,
        globalVars,
      }
    ) as t.Statement[];

    t.addComments(postconditionEffects[0], 'leading', [
      {value: `Postcondition Effects Start`, type: 'CommentBlock'},
    ]);
    t.addComments(postconditionEffects.at(-1)!, 'trailing', [
      {value: `Postcondition Effects End`, type: 'CommentBlock'},
    ]);
    classBody.push(
      t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier('result'), createIIFE(postconditionEffects)),
      ])
    );

    const postStateCapture = t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier(c2t.stateIdentifier), t.identifier('capturePost')),
        []
      )
    );
    t.addComments(postStateCapture, 'leading', [
      {value: `OCL Post-state Snapshot`, type: 'CommentBlock'},
    ]);
    classBody.push(postStateCapture);

    const postconditionChecks = returnFullBuildResult(
      postconditionChecker.transform(`postcondition:\n${op.postcondition}`, 'Postcondition', {
        vars,
        globalVars,
      }) as t.Statement[]
    );
    t.addComments(postconditionChecks[0], 'leading', [
      {value: `Postcondition Check Start`, type: 'CommentBlock'},
    ]);
    t.addComments(postconditionChecks.at(-1)!, 'trailing', [
      {value: `Postcondition Check End`, type: 'CommentBlock'},
    ]);
    classBody.push(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(
              t.identifier('errorMessage'),
              t.identifier('postconditionErrorMessage')
            ),
            t.objectProperty(t.identifier('pass'), t.identifier('isPostconditionPass')),
          ]),
          createIIFE(postconditionChecks)
        ),
      ]),
      t.ifStatement(
        t.unaryExpression('!', t.identifier('isPostconditionPass')),
        t.blockStatement([
          t.throwStatement(
            t.newExpression(t.identifier('PostconditionError'), [
              t.identifier('postconditionErrorMessage'),
            ])
          ),
        ])
      ),
      op.returnType?.type === 'void' || !op.returnType
        ? t.returnStatement()
        : t.returnStatement(t.identifier('result'))
    );

    const classMethod = t.classMethod(
      'method',
      t.identifier(op.name),
      (op.parameters || []).map((param) => {
        const p = t.identifier(param.name);
        p.typeAnnotation = getTypescriptType(param.type.split('[')[0]);
        return p;
      }),
      t.blockStatement(classBody)
    );
    classMethod.returnType = getTypescriptType(op.returnType?.type || 'void');
    t.addComments(
      classMethod,
      'leading',
      [
        {
          value: op.description
            .split('\n')
            .map((l) => l.replaceAll('\n', '').replaceAll('\t', '').trim())
            .join('\n*'),
          type: 'CommentBlock',
        },
      ]
      // op.description.split(',').map((value) => ({value: value.trim(), type: 'CommentLine'}))
    );

    return classMethod;
  });

  const classDeclaration = t.classDeclaration(
    t.identifier(service.name),
    null,
    t.classBody([...classProperties, ...operationsBody])
  );
  const program = t.program([
    classDeclaration,
    t.exportNamedDeclaration(null, [
      t.exportSpecifier(t.identifier(service.name), t.identifier(service.name)),
    ]),
  ]);
  const file = t.file(program);
  return {file, counter: c2t.counter};
};
