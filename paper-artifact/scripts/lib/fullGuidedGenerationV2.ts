import assert from 'node:assert/strict';
import {rq1Request} from './rq1NarrativeComparisons';
import {hash} from './m4LiveAdapter';
import {compileFullGenerationDecisionPlan} from '../../src/app/service/fullGenerationDecisionPlan';
import {parse,generateContractCode} from '../../src/app/util';
import * as P from '../../antlr4/REMODELParser';
import type {NarrativeInput} from '../../src/app/service/narrativeObligationCompiler';
import type {OperationModelGrounding} from '../../src/app/service/operationModelGrounding';
import type {prepareStage5Arm} from './contractgenStage5';

export function fullGuidedRunMetadata(preview:string,identity:{config:unknown;version:string;method?:string},mock=false){
  return {preview,identityHash:hash(JSON.stringify(identity)),config:identity.config,mock,
    generationRevision:identity.version,slots:[`${identity.method??'full'}__1`]};
}

export function prepareFullGuidedV2(id:string,snapshotRoot?:string) {
  return enhanceFullRequestV2(rq1Request(id,'full',snapshotRoot));
}

export function enhanceFullRequestV2<T extends {method:string;loaded:{input:NarrativeInput;context:OperationModelGrounding};
 base:ReturnType<typeof prepareStage5Arm>;messages:{role:string;content:string}[];extraction:unknown;clauseRequests:unknown;hash:string}>(base:T) {
  assert.equal(base.method,'full');
  const {input,context}=base.loaded;
  const decisions=compileFullGenerationDecisionPlan(input,base.base.prepared,context);
  const original=JSON.parse(base.messages[1].content);
  // Drop only repeated audit prose; task identity, condition scope, unresolved fields and K remain intact.
  const compactTn={...original.Tn,tasks:original.Tn.tasks.map((task:any)=>{
    const {provenance,rationale,...rest}=task;return rest;
  })};
  const {BehavioralRoles,...rest}=original;
  const decisionView={version:decisions.version,hash:decisions.hash,planHash:decisions.planHash,
    sourceHash:decisions.sourceHash,modelHash:decisions.modelHash,
    tasks:decisions.tasks.map(({taskId,roleIds,parameterIds,modelCandidates,attributeCandidates,unresolved})=>
      ({taskId,roleIds,parameterIds,modelCandidates,attributeCandidates,unresolved})),
    roles:decisions.roles.map(role=>({...role,sourceEvidence:role.sourceEvidence.map(({start,end})=>({start,end}))})),
    constructionPolicy:decisions.constructionPolicy,
    evidenceResolution:'Task source, context and branch evidence are the unchanged Tn coordinates into NarrativeRequirement. Role source coordinates use the same narrative. Full decision evidence is saved separately.',
    semanticCompletenessProven:false};
  const body={...rest,Tn:compactTn,GenerationDecisionPlan:decisionView};
  const messages=[base.messages[0],{role:'user',content:JSON.stringify(body)}];
  assert.equal(hash(JSON.stringify(body.K)),hash(JSON.stringify(original.K)));
  assert.equal(hash(JSON.stringify(body.ModelContext)),hash(JSON.stringify(original.ModelContext)));
  assert.equal(body.NarrativeRequirement.text,input.narrativeRequirement);
  const request={...base,messages,hash:hash(JSON.stringify({messages,extraction:base.extraction,clauseRequests:base.clauseRequests}))};
  return {version:'full-guided-generation-v2',request,decisions,
    baseRequestHash:base.hash,requestHash:request.hash,
    characters:{baseline:JSON.stringify(base.messages).length,enhanced:JSON.stringify(messages).length},
    immutable:{planHash:base.base.prepared.Tn.planHash,modelHash:base.base.prepared.fullModelHash,
      rulesShared:false,sharedLanguageVersion:base.base.common.TargetLanguage.version,
      sharedLanguageHash:base.base.common.TargetLanguage.sha256,referenceAccess:false,oracleAccess:false}};
}

/** Warnings identify ungrounded extra restrictions; they do not prove NL equivalence or reject candidates. */
export function auditFullGuidedV2(prepared:ReturnType<typeof prepareFullGuidedV2>,candidate:{definition?:string|null;precondition:string;postcondition:string}) {
  const op=prepared.request.loaded.context.index.operation;
  const text=generateContractCode({serviceName:op.service,operationName:op.name,
    parameters:op.parameters.map(p=>({name:p.name,type:p.type.raw})),returnedType:op.returnType?.type.raw,...candidate,definition:candidate.definition??undefined});
  const parsed=parse(text),warnings:any[]=[];
  if(!parsed.tree||parsed.errors.length)return {parserValid:false,errors:parsed.errors,warnings,semanticCorrectness:'unresolved'};
  const walk=(node:any,fn:(node:any)=>void)=>{fn(node);for(const child of node.children??[])walk(child,fn);};
  const bindings=new Map<string,string>();
  walk(parsed.tree,node=>{
    if(node instanceof P.RuleVariableDeclarationCSContext&&node.parentCtx instanceof P.RuleDefinitionContext){
      const value=node.ruleOCLExpressionCS()?.getText();
      const state=op.serviceState.find(state=>value===`self.${state.name}`);
      if(state)bindings.set(node.ruleSimpleNameCS().getText(),state.id);
    }
  });
  walk(parsed.tree,node=>{
    if(!(node instanceof P.RuleStandardNavigationCallExpCSContext))return;
    let parent:any=node,pre=false;while(parent){if(parent instanceof P.RulePreconditionContext)pre=true;parent=parent.parentCtx;}
    if(!pre)return;
    const collection=node.ruleClassiferCallExpCS();
    const operation=node.ruleStandardCollectionOperation();
    if(!collection||operation?.children?.[0]?.getText()!=='includes')return;
    const name=operation.ruleSimpleNameCS()?.getText(),stateId=bindings.get(name);
    if(!stateId)return;
    let scope:any=node.parentCtx;
    while(scope){
      if((scope instanceof P.RuleLetExpCSContext||scope instanceof P.RuleIteratorExpCSContext)&&
        scope.ruleVariableDeclarationCS_list().some((d:any)=>d.ruleSimpleNameCS().getText()===name))return;
      scope=scope.parentCtx;
    }
    warnings.push({code:'FG-REFERENCE-MEMBERSHIP',status:'unresolved',enforcement:'advisory',
      expression:node.getText(),line:node.start.line,column:node.start.column,
      stateId,binding:name,sourceHash:prepared.decisions.sourceHash,
      message:'Repository membership is stronger than definedness of this service-state reference. Verify an independent requirement source; this is not automatically a violation.'});
  });
  return {parserValid:true,errors:[],warnings,semanticCorrectness:'unresolved'};
}
