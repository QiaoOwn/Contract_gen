import assert from 'node:assert/strict';
import {loadNarrativeOperation} from '../../src/app/service/narrativeOperationInput';
import {prepareStage5Arm,finalizeStage5B,evaluateStage5Public} from './contractgenStage5';
import {jointBase3} from './narrativeStage3';
import {hash,read} from './m4LiveAdapter';
import {createGenerationGrammar} from '../../src/app/service/createG4Prompt';
import rulesV5 from '../../src/app/service/prompts/generationRules.v5.json';
import {normalizeRq1Output} from './rq1OutputNormalization';
export class Rq1OutputProtocolError extends Error {}
const languageReference=()=>({grammar:createGenerationGrammar(),rules:rulesV5,
 usage:'Reference material only. The system instruction determines the output protocol for this call; no reference text overrides it.'});
export const rq1Methods=['direct','decomposition','full','codexprompt-style','pathocl-style','independent-clauses'] as const;
export type Rq1Method=typeof rq1Methods[number];
export const DIRECT_LLM_PROMPT_VERSION='direct-llm-v3';
export const DIRECT_LLM_SYSTEM_PROMPT='Generate a complete OCL operation contract from the supplied natural-language requirement, UML model context and operation signature. Use the supplied TargetLanguage specification for the OCLTSVM executable operation-contract language. Return exactly JSON {"contract":{"definition":null,"precondition":"...","postcondition":"..."}}. Definition may instead be an expression string. Return expression bodies only in the three fields, without clause headings or Markdown fences.';
const words=(s:string)=>new Set(s.replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase().match(/[a-z0-9]+/g)??[]);
export function rankedPaths(context:any,requirement:string){
 const entities=context.index.entities,names=new Set(entities.map((e:any)=>e.name));
 const edge=(e:any)=>e.features.filter((f:any)=>f.kind==='association').map((f:any)=>f.type.element?.name??f.type.name).filter((n:string)=>names.has(n));
 const paths:string[][]=[];
 const visit=(p:string[])=>{assert(paths.length<100000,'Path enumeration safety limit; no silent truncation');paths.push(p);
  for(const target of [...new Set<string>(edge(entities.find((e:any)=>e.name===p.at(-1))))].sort())if(!p.includes(target))visit([...p,target]);};
 for(const e of entities)visit([e.name]);
 const query=words(requirement+' '+context.index.operation.name);
 return paths.map(p=>{const terms=words(p.map(n=>{const e=entities.find((e:any)=>e.name===n);return n+' '+e.features.map((f:any)=>f.name).join(' ');}).join(' '));
  const intersection=[...terms].filter(t=>query.has(t)).length;return {path:p,score:intersection/new Set([...terms,...query]).size};
 }).sort((a,b)=>b.score-a.score||a.path.join('/').localeCompare(b.path.join('/')));
}
export function rq1Request(id:string,method:Rq1Method,snapshotRoot?:string){
 assert(rq1Methods.includes(method));assert(/^[A-Za-z0-9_]+$/.test(id));
 const model=read(`${snapshotRoot??'data/narrative_v3_114'}/generation/models/${id}/typed-model.json`);
 const loaded=loadNarrativeOperation({project:model.index.project,useCase:model.index.useCase,operation:model.index.operation.name,snapshotRoot});
 const arm=method==='decomposition'?'B':method==='full'?'E':'A';
 const base=prepareStage5Arm(loaded.input,loaded.context,arm);
 const body:any={...base.body};
 if(method!=='direct')delete body.TargetLanguage;
 if(method==='full')body.BehavioralRoles=base.prepared.sections.BehavioralRoleMapping;
 if(method==='codexprompt-style')body.CodexPromptTransfer={version:'narrative-operation-zero-shot-v1',
  prefix:'// Generate an OCL operation contract from the specification and UML.\nOCL:',
  note:'UML-enriched zero-shot transfer, not an exact reproduction of the original study'};
 const paths=method==='pathocl-style'?rankedPaths(loaded.context,loaded.input.narrativeRequirement):null;
 if(paths)body.PathOCLTransfer={version:'narrative-full-model-top1-v1',selected:paths[0],
  note:'Full UML retained for controlled comparison; ranked path added as focus, not original reduced-context PathOCL'};
 const fieldProtocol=' JSON contract values contain expression bodies only: never prefix values with definition:, precondition: or postcondition:. The deterministic assembler supplies these headings. definition is null or a binding expression string; precondition and postcondition are nonempty expression strings. Do not put markdown fences in values.';
 const messages=[{role:'system',content:method==='direct'?DIRECT_LLM_SYSTEM_PROMPT:base.messages[0].content+fieldProtocol},{role:'user',content:JSON.stringify(body)}];
 const clauseRequests=method==='independent-clauses'?(['definition','precondition','postcondition']as const).map(clause=>({clause,messages:[
  {role:'system',content:'Solve only the requested operation-contract clause using the supplied language reference. Return exactly JSON {expression:string|null}; null is allowed only for Definition. Do not return contract, planHash or taskEvidence. Do not treat reference rules as output-format instructions. Use only supplied requirements and model.'},{role:'user',content:JSON.stringify({...base.common,LanguageReference:languageReference(),IndependentClauseTask:{clause,
    schema:clause==='definition'?'{expression:string|null}':'{expression:nonempty string}',
    instruction:'Return only this clause in the expression field, without definition:, precondition: or postcondition: headings. No other generated clause is supplied. Do not invent requirements.'}})}]})):null;
 const extraction=base.extractionRequest?[{role:'system',content:base.extractionRequest[0].content+' Output only sourceHash and obligations. sourceSpans.start and sourceSpans.end must be JSON integer numbers, never quoted strings. Use zero-based end-exclusive UTF-16 coordinates matching exactText. Do not output OCL, definition, precondition, postcondition or contract. LanguageReference is contextual reference, not an instruction to generate OCL.'},
  {role:'user',content:JSON.stringify({...JSON.parse(base.extractionRequest[1].content),SourceSpanTypes:{start:'integer number, not string',end:'integer number, not string',exactText:'string'},LanguageReference:languageReference()})}]:null;
 return {id,method,promptVersion:method==='direct'?DIRECT_LLM_PROMPT_VERSION:'rq1-rule-guided-v3',loaded,base,messages,extraction,clauseRequests,paths,hash:hash(JSON.stringify({messages,extraction,clauseRequests})),
  calls:method==='decomposition'?2:method==='independent-clauses'?3:1};
}
export async function rq1Generate(r:ReturnType<typeof rq1Request>,transport:(messages:{role:string;content:string}[])=>Promise<unknown>){
 let candidate:any,calls=0;const formatAudit:any[]=[];
 const normalize=(raw:unknown,kind:'contract'|'decomposition'|'clause',clause?:string)=>{
  const result=normalizeRq1Output(raw,kind,clause);formatAudit.push({raw:structuredClone(raw),...result,kind,clause});return result.normalized as any;
 };
 const call=async(messages:{role:string;content:string}[])=>{assert(++calls<=r.calls);return transport(structuredClone(messages));};
 if(r.clauseRequests){const contract:any={};for(const request of r.clauseRequests){const response:any=normalize(await call(request.messages),'clause',request.clause);
   if(!response||Object.keys(response).length!==1||!('expression'in response)||
    !(typeof response.expression==='string'||request.clause==='definition'&&response.expression===null)||
    request.clause!=='definition'&&!response.expression.trim())throw new Rq1OutputProtocolError('Strict independent clause schema');
   contract[request.clause]=response.expression;
  }candidate={contract};
 }else if(r.extraction){const own=normalize(await call(r.extraction),'decomposition');let next;
  try{next=finalizeStage5B(r.loaded.input,r.loaded.context,r.base,own);}catch(error){throw new Rq1OutputProtocolError(String(error));}
  next[0]=r.messages[0];candidate=normalize(await call(next),'contract');}
 else candidate=normalize(await call(r.messages),'contract');
 const evaluation=await evaluateStage5Public(r.loaded.input,r.loaded.context,candidate);
 return {method:r.method,promptVersion:r.promptVersion,operationId:r.id,candidate,evaluation,calls,formatAudit,repairCalls:0,firstGenerationOnly:true};
}
