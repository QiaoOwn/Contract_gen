import assert from 'node:assert/strict';
import {rq1Request,rankedPaths} from './lib/rq1NarrativeComparisons';
import {hash} from './lib/m4LiveAdapter';
import {pathOclSelection} from './rq1PathOclContext';

export const independentBaselineMethods=['codexprompt-style','pathocl-style'] as const;
export type IndependentBaselineMethod=typeof independentBaselineMethods[number];
export const independentBaselineVersion='rq1-independent-language-only-v2';
export function independentBaselineRequest(id:string,method:IndependentBaselineMethod){
 assert(independentBaselineMethods.includes(method));
 // Reuse only authoritative input loading and the common public output evaluator.
 // None of the compiler products in the returned internal reference enter messages.
 const reference=rq1Request(id,'direct');
 const input=JSON.parse(reference.messages[1].content);
 const common={operationId:id,NarrativeRequirement:input.NarrativeRequirement,OperationSignature:input.OperationSignature,
  ModelContext:input.ModelContext,TargetLanguage:input.TargetLanguage};
 const protocol='Return exactly JSON {"contract":{"definition":null,"precondition":"...","postcondition":"..."}}. Definition may be a binding expression string. Return expression bodies without clause headings, Markdown fences or explanation.';
 let system='Generate a complete OCL operation contract from the supplied requirement, operation signature and UML. Use the supplied OCLTSVM executable operation-contract grammar. '+protocol;
 let user:string,paths:ReturnType<typeof rankedPaths>|null=null;
 let pathAudit:ReturnType<typeof pathOclSelection>['audit']|null=null;
 if(method==='codexprompt-style'){
  const comment=(text:string)=>text.split(/\r?\n/).map(line=>'// '+line).join('\n');
  user='// This file contains the UML classes and associations of the target model.\n// UML model information:\n'+
   comment(JSON.stringify(common.ModelContext,null,2))+
   '\n\n// The task is to generate an object constraint language (OCL) operation contract according to the given specification.\n// Operation:\n'+
   comment(JSON.stringify(common.OperationSignature))+'\n// Specification:\n'+comment(common.NarrativeRequirement.text)+
   '\n\n// Target language grammar:\n'+comment(common.TargetLanguage.grammar)+'\nOCL:\n';
 }else{
  const selection=pathOclSelection(reference.loaded.context,id);paths=selection.ranked;pathAudit=selection.audit;
  system='As a system designer with expertise in UML modeling and OCL constraints, assist the user in writing a complete OCL operation contract. '+
   'The user provides a natural-language specification, the target operation, and UML classes and their properties along one ranked simple path. '+
   'Generate the complete Definition, Precondition and Postcondition according to the supplied UML. Use the supplied OCLTSVM grammar. '+protocol;
  user='-- OCL specification\n'+common.NarrativeRequirement.text+'\n\n-- Target operation\n'+JSON.stringify(common.OperationSignature)+
   '\n\n'+selection.classes.map(c=>'-- UML properties of class '+c.class+'\n'+JSON.stringify(c,null,2)).join('\n\n')+
   '\n\n-- Operation signature context (state declarations, enumerations and environment)\n'+JSON.stringify(selection.operationContext,null,2)+
   '\n\n-- Target language grammar\n'+common.TargetLanguage.grammar+'\n\n-- OCL operation contract\n';
 }
 const messages=[{role:'system',content:system},{role:'user',content:user}];
 const promptVersion=method==='codexprompt-style'?'codexprompt-style-rq1-independent-language-only-v1':'pathocl-selected-context-v2';
 const request={...reference,method,promptVersion,messages,
  extraction:null,clauseRequests:null,paths,calls:1,
  hash:hash(JSON.stringify({messages,extraction:null,clauseRequests:null}))};
 return {request,common,version:independentBaselineVersion,pathAudit,
  adaptation:method==='codexprompt-style'?'UML-enriched comment-prefix zero-shot contract transfer':
   'spaCy noun/adjective lemmas + Jaccard top-1 + selected-path UML only; complete operation contract adaptation',
  excluded:['Rules V5','Definition guidance','Tn','B','Generation R','K','GenerationDecisionPlan','reference OCL','Oracle']};
}
