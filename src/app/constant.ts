import * as t from '@babel/types';
import {OpenAIChatModelId} from '@langchain/openai';

export const tsTypeMap = {
  Integer: t.tsNumberKeyword(),
  String: t.tsStringKeyword(),
  Real: t.tsNumberKeyword(),
  Boolean: t.tsBooleanKeyword(),
  Date: t.tsTypeReference(t.identifier('dayjs.Dayjs')),
  LocalDate: t.tsTypeReference(t.identifier('dayjs.Dayjs')),
};

export const tsTypeMapCode = {
  TSAnyKeyword: 'any',
};

export const whatIsDefinition = `
The optional definition field introduces query-only helper bindings used by the precondition or postcondition.
Each binding has the form name:Type = expression, uses lowerCamelCase for name, and is separated from the next binding by a comma.
Do not encode state changes in definition. Return null when no helper binding is needed.
`;

export const whatIsPrecondition = `
The precondition is a non-mutating Boolean expression over the state before operation execution.
Use it only for input admissibility, existence, status, quota, and other conditions that must already hold.
It may use operation parameters, service state, and helper bindings from definition.
`;

export const whatIsPostcondition = `
The postcondition is a Boolean expression describing the required state after successful operation execution.
It may create or remove repository objects, update attributes and associations, update service state, and constrain result.
Use @pre only when an effect depends on a value from before execution.
`;

export const defaultModel: OpenAIChatModelId = 'gpt-5.4-mini';
export const models: OpenAIChatModelId[] = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gemini-3.5-flash',
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'qwen3-coder-plus',
  'qwen3-coder-flash',
];
