import {generateContractCode,parse} from '../util';
import {validateModelGroundedContract} from './validateModelGroundedContract';
import {modelDeclarations} from './modelDeclarations';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {NarrativeInput} from './narrativeObligationCompiler';
import type {prepareNarrativeInputV4} from './narrativeInputV4';
import type {OclLocation} from './modelRuleDiagnostics';
import * as P from '../../../antlr4/REMODELParser';
import assert from 'node:assert/strict';
import {ccHash} from './crossClauseGraph';

type Prepared=Extract<ReturnType<typeof prepareNarrativeInputV4>,{enabled:true}>;
type Candidate={definition?:string|null;precondition:string;postcondition:string};
type Evidence={start:number;end:number;text:string;taskIds:string[]};
const words=(s:string)=>s.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').toLowerCase();
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

/** Relates actual typed AST uses to source evidence; missing lexical evidence is not a semantic refutation. */
export function auditFullSourceUse(input:NarrativeInput,prepared:Prepared,context:OperationModelGrounding,candidate:Candidate){
 assert.equal(input.sourceHash,ccHash(input.narrativeRequirement),'Source hash mismatch');
 assert.equal(prepared.Tn.sourceHash,input.sourceHash,'Audit plan/source mismatch');
 assert.equal(prepared.fullModelHash,ccHash(context),'Audit model mismatch');
 const op=context.index.operation;
 const contract=generateContractCode({serviceName:op.service,operationName:op.name,
  parameters:op.parameters.map(p=>({name:p.name,type:p.type.raw})),returnedType:op.returnType?.type.raw,
  ...candidate,definition:candidate.definition??undefined});
 const parsed=parse(contract);
 if(!parsed.tree||parsed.errors.length)return {version:'full-source-use-audit-v1',parserValid:false,errors:parsed.errors,
  uses:[],diagnostics:[],semanticCorrectness:'unresolved'};
 const validation=validateModelGroundedContract({tree:parsed.tree,context,collectRepairEvidence:true});
 const declarations=modelDeclarations(context.index);
 const evidence=(name:string):Evidence[]=>{
  const phrase=words(name).replace(/^(?:is|has) /,'');
  if(phrase.length<3)return [];
  const pattern=new RegExp(`\\b${escape(phrase).replaceAll(' ','[ -]')}\\b`,'gi');
  return [...input.narrativeRequirement.matchAll(pattern)].map(m=>({start:m.index!,end:m.index!+m[0].length,text:m[0],
    taskIds:prepared.Tn.tasks.filter(task=>task.contextSpans.some(s=>s.start<=m.index!&&s.end>=m.index!+m[0].length)).map(t=>t.taskId)}));
 };
 const uses=validation.repairEvidence!.references.map(ref=>{
  const declaration=declarations.find(d=>d.id===ref.modelElementId);
  const state=op.serviceState.find(s=>s.id===ref.modelElementId);
  const feature=context.index.entities.flatMap(e=>e.features).find(f=>f.id===ref.modelElementId);
  const roleEvidence=state?prepared.RoleMapping.roles.filter(role=>role.qualifier==='current'&&role.typeIds.some(id=>
    context.index.entities.some(e=>e.id===id&&e.name===state.type.name))).flatMap(role=>prepared.RoleMapping.mentions
      .filter(m=>role.sourceMentions.includes(m.id)).map(m=>({...m.span,taskIds:m.taskIds}))):[];
  const source=[...evidence(state?.name??feature?.name??declaration?.name??''),...roleEvidence];
  return {modelElementId:ref.modelElementId,declaration:declaration?.declaration??null,location:ref,sourceEvidence:source,
    sourceStatus:source.length?'lexical-or-role-candidate':'unresolved',businessSupportProven:false};
 });
 const diagnostics:{code:string;status:'unresolved';location:OclLocation;modelElementIds:string[];message:string}[]=[];
 for(const use of uses){
  if(use.sourceEvidence.length)continue;
  if(op.serviceState.some(s=>s.id===use.modelElementId))diagnostics.push({code:'SOURCE-STATE-USE',status:'unresolved',location:use.location,
    modelElementIds:[use.modelElementId],message:'This declared service-state access has no direct textual/current-role support. Declaration availability does not authorize an extra guard or effect.'});
  else if(use.location.clause==='definition'&&use.modelElementId.includes('/attribute/'))diagnostics.push({code:'SOURCE-SELECTOR-PREDICATE',status:'unresolved',location:use.location,
    modelElementIds:[use.modelElementId],message:'Check whether this Definition predicate narrows the intended object set beyond the source. An attribute declaration alone is insufficient evidence.'});
 }
 const walk=(node:any)=>{
  if(node instanceof P.RuleClassiferCallExpCSContext){
   const name=node.ruleSimpleNameCS().getText();
   const paths=context.index.entities.flatMap(e=>e.features.filter(f=>f.kind==='association'&&f.type.kind==='set'&&f.type.element?.name===name)
     .map(f=>({owner:e.name,id:f.id,declaration:`${e.name}.${f.name}: ${f.type.raw}`})));
   if(paths.length&&node.getText().includes('allInstances')){
    const loc=validation.repairEvidence!.expressions.find(e=>e.startOffset<=node.start.start&&e.endOffset>=(node.stop?.stop??0));
    if(loc)diagnostics.push({code:'SOURCE-COLLECTION-UNIVERSE',status:'unresolved',location:loc,modelElementIds:paths.map(p=>p.id),
      message:`A global ${name} repository and association collections (${paths.map(p=>p.declaration).join('; ')}) have different runtime domains. Source evidence must determine the intended domain; no equivalence is inferred.`});
   }
  }
  for(const child of node.children??[])walk(child);
 };walk(parsed.tree);
 return {version:'full-source-use-audit-v1',parserValid:true,errors:[],modelDiagnostics:validation.diagnostics,uses,
  diagnostics,semanticCorrectness:'unresolved',acceptanceChanged:false};
}
