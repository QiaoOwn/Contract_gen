import type {Message3} from '../rq3OrdinaryRepair';

export const PLAIN_REPAIR_VERSION='plain-llm-error-feedback-v1';
/** Explicit allowlist: never spread the ContractGen generation body into this request. */
export function plainRepairBase(common:{NarrativeRequirement:unknown;OperationSignature:unknown;ModelContext:unknown;TargetLanguage:unknown}):Message3[]{
 return [{role:'system',content:'Repair the supplied OCL operation contract using the original requirement, UML model, operation signature and public target-language specification. Correct the reported validator errors. Return exactly JSON {"contract":{"definition":null,"precondition":"...","postcondition":"..."}}. Definition may instead be a binding expression string. Return clause expression bodies only, without headings or Markdown. Do not invent requirements.'},
  {role:'user',content:JSON.stringify({NarrativeRequirement:common.NarrativeRequirement,OperationSignature:common.OperationSignature,ModelContext:common.ModelContext,TargetLanguage:common.TargetLanguage})}];
}
