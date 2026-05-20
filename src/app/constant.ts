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

export const whatIsDefination = `
Variables can be defined and can be used in the precondition or postcondition section. 
You should find the entity or entities you need for the next step and must set the proper value to it. 
The variable name \`must be smallCamelCase\`.
The variables are separate with a comma.
Note: the definition section is not required.
`;
export const whatIsPrecondition = `
The contract of a system operation specifies the conditions that the state of the system is assumed to satisfy before the execution of the postcondition.
You should use the variables from the definition if provided or use the global variable from the context to check the conditions
`;
export const whatIsPostcondition = `The conditions that the system state is required to satisfy after the execution (if it terminated), called the postcondition of the system operation. 
Typically, the precondition specifies the properties of the system state that need to be checked when system operation is to be executed, and the postcondition defines the possible changes that the execution of the system operation is to realize. 
The global variable can only be set value in postcondition`;

export const defaultModel: OpenAIChatModelId = 'gpt-5.4-mini';
export const models: OpenAIChatModelId[] = [
  'gpt-5.4',
  'gpt-5.4-mini',
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'qwen3-coder-plus',
  'qwen3-coder-flash',
];
