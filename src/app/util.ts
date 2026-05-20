import {CommonTokenStream} from 'antlr4';
import {RuleContractContext} from '../../antlr4/REMODELParser';
import {getRemodelAntlr} from '@/remodel/parser';
import * as prettier from 'prettier/standalone';
import * as babel from 'prettier/parser-babel';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as ts from 'prettier/parser-typescript';
import * as t from '@babel/types';
import {tsTypeMap} from './constant';
import {Parameter} from '@/rm2pt/model/Parameter';

export function formatTypescript(code: string) {
  return prettier.format(code, {
    trailingComma: 'all',
    jsxSingleQuote: false,
    semi: true,
    plugins: [prettierPluginEstree as unknown as string, babel, ts],
    parser: 'babel-ts',
    arrowParens: 'always',
    bracketSpacing: true,
    htmlWhitespaceSensitivity: 'css',
    insertPragma: false,
    jsxBracketSameLine: true,
    printWidth: 80,
    proseWrap: 'preserve',
    quoteProps: 'as-needed',
    requirePragma: false,
    singleQuote: false,
    tabWidth: 2,
    useTabs: false,
    vueIndentScriptAndStyle: false,
  });
}
export function formatContract(ast: RuleContractContext, tokens: CommonTokenStream): string {
  let formattedCode = '';
  let currentCondition = '';
  let lastText = '';
  const conditionText = ['precondition', 'postcondition', 'definition'];
  function walk(node: RuleContractContext): void {
    if (node.children) {
      node.children.forEach((child) => {
        walk(child as RuleContractContext);
      });
    } else {
      const text = node.getText();
      if (text === ':' && conditionText.includes(lastText)) {
        formattedCode += `${text}\n\t\t`;
      } else if (['Contract', ':', 'let'].some((t) => t === text)) {
        formattedCode += `${text} `;
      } else if (['{', ':', 'let'].some((t) => t === text)) {
        formattedCode += ` ${text}`;
      } else if (['='].some((t) => t === text)) {
        formattedCode += ` ${text} `;
      } else if (['in', 'and', 'or'].some((t) => t === text)) {
        formattedCode += ` ${text}\n\t\t`;
      } else if (currentCondition === 'definition' && ',' === text) {
        formattedCode += `${text}\n\t\t`;
      } else if (['if'].some((t) => t === text)) {
        formattedCode += `${text} `;
      } else if (['then', 'endif', 'else'].some((t) => t === text)) {
        formattedCode += ` \n\t\t${text} `;
      } else if (conditionText.some((t) => t === text)) {
        currentCondition = text;
        const n = node as unknown as {symbol: {tokenIndex: number}};
        const commentTokens = tokens.getHiddenTokensToLeft(n.symbol.tokenIndex, 1);
        if (commentTokens?.length) {
          commentTokens.forEach((token) => {
            formattedCode += `\n\t${token.text}`;
          });
        }
        formattedCode += `\n\t${text}`;
      } else if (['}'].some((t) => t === text)) {
        formattedCode += `\n${text}`;
      } else {
        formattedCode += text;
      }
      lastText = text;
    }
  }
  walk(ast);
  return formattedCode;
}

export const parse = (inputCode: string) => {
  const {parser, tokens} = getRemodelAntlr(inputCode);
  const errors: {line: number; column: number; msg: string}[] = [];
  parser.addErrorListener({
    syntaxError: function (_recognizer, _offendingSymbol, line, column, msg) {
      errors.push({line, column, msg});
    },
  });
  let tree: RuleContractContext | undefined;
  try {
    tree = parser.ruleContract();
  } catch (error) {
    console.log(error);
  }
  parser.removeErrorListeners();
  return {errors, tree, tokens};
};

export function getTypescriptType(type: string) {
  let basicType: t.TSType = tsTypeMap[type as keyof typeof tsTypeMap];
  if (!basicType) {
    if (type.includes('[')) {
      basicType = t.tsTypeReference(t.identifier(type.split('[')[0]));
    } else if (type.includes('Set(')) {
      basicType = t.tsArrayType(
        getTypescriptType(type.replace('Set(', '').replace(')', '')).typeAnnotation
      );
    } else {
      basicType = t.tsTypeReference(t.identifier(type));
    }
  }
  return t.tsTypeAnnotation(basicType);
}

export const generateContractCode = ({
  serviceName,
  operationName,
  parameters = [],
  returnedType,
  definition,
  precondition,
  postcondition,
}: {
  serviceName: string;
  operationName: string;
  parameters?: Parameter[];
  returnedType?: string;
  definition?: string;
  precondition: string;
  postcondition: string;
}) => {
  const code = `Contract ${serviceName}::${operationName}(${parameters
    .map((parameter) => `${parameter.name}:${parameter.type}`)
    .join(',')})${returnedType ? `: ${returnedType}` : ''} {
          ${
            definition
              ? `definition:
          ${definition}
            `
              : ''
          }
            ${
              precondition
                ? `precondition:
          ${precondition}
            `
                : ''
            }
            ${
              postcondition
                ? `postcondition:
          ${postcondition}
            `
                : ''
            }
        }`;
  return code;
};
