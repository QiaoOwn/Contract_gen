import assert from 'node:assert/strict';
import {ccHash} from './crossClauseGraph';
import type {NarrativeInput} from './narrativeObligationCompiler';
import type {prepareNarrativeInputV4} from './narrativeInputV4';
import type {OperationModelGrounding} from './operationModelGrounding';
import {modelDeclarations} from './modelDeclarations';

type Prepared = Extract<ReturnType<typeof prepareNarrativeInputV4>, {enabled:true}>;
type Span = {start:number;end:number};

/** Source-backed planning metadata, never an OCL answer or a business identity proof. */
export function compileFullGenerationDecisionPlan(input:NarrativeInput, prepared:Prepared, context:OperationModelGrounding) {
  assert.equal(prepared.Tn.sourceHash,input.sourceHash);
  assert.equal(prepared.fullModelHash,ccHash(context),'Decision plan requires the matching authoritative model');
  const spans=(items:readonly Span[])=>items.map(({start,end})=>{
    assert(Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>start&&end<=input.narrativeRequirement.length);
    return {start,end,text:input.narrativeRequirement.slice(start,end)};
  });
  const declarations=modelDeclarations(context.index);
  const stateById=new Map(context.index.operation.serviceState.map(state=>[state.id,state]));
  const roles=prepared.RoleMapping.roles.map(role=>{
    const states=[...stateById.values()].filter(state=>role.typeIds.some(typeId=>
      context.index.entities.some(entity=>entity.id===typeId&&entity.name===state.type.name)));
    const candidates=[...new Map(states.map(state=>[state.name,state])).values()];
    const mentions=prepared.RoleMapping.mentions.filter(mention=>role.sourceMentions.includes(mention.id));
    return {roleId:role.id,typeIds:role.typeIds,qualifier:role.qualifier,
      sourceEvidence:spans(mentions.map(mention=>mention.span)),
      stateCandidates:role.qualifier==='current'?candidates.map(state=>({id:state.id,name:state.name,type:state.type.raw})):[],
      status:'proposed' as const,businessIdentityProven:false,
      referencePolicy:role.qualifier==='current'?'A compatible service-state reference is a candidate. Reference definedness does not imply repository membership. Require independent source evidence for an additional membership guard.':'Model type compatibility alone does not establish object identity.'};
  });
  const tasks=prepared.Tn.tasks.map(task=>({taskId:task.taskId,category:task.category,
    sourceEvidence:spans(task.sourceSpans),contextEvidence:spans(task.contextSpans),
    conditionScope:{kind:task.conditionScope.kind,polarity:task.conditionScope.polarity,evidence:spans(task.conditionScope.evidence)},
    action:task.behavioralAction.kind,
    parameterIds:context.index.operation.parameters.filter(p=>task.referencedParameters.includes(p.name)).map(p=>p.id),
    roleIds:prepared.RoleMapping.taskRoles.find(t=>t.taskId===task.taskId)?.roleCandidates??[],
    modelCandidates:prepared.RoleMapping.taskRoles.find(t=>t.taskId===task.taskId)?.modelCandidates??[],
    attributeCandidates:prepared.RoleMapping.taskRoles.find(t=>t.taskId===task.taskId)?.attributeCandidates??[],
    unresolved:task.category==='unresolved'||task.behavioralAction.kind==='unknown'||Boolean(task.unresolvedReason)}));
  const branches=tasks.filter(task=>task.conditionScope.kind==='branch').map(task=>({taskId:task.taskId,clause:task.category,scope:task.conditionScope}));
  const body={version:'full-generation-decision-plan-v1',operationId:input.operationId,sourceHash:input.sourceHash,
    planHash:prepared.Tn.planHash,modelHash:ccHash(context),tasks,roles,branches,
    parameterDeclarations:declarations.filter(d=>d.name.startsWith('$parameter.')),
    returnDeclaration:declarations.find(d=>d.name==='$result')??null,
    constructionPolicy:{
      taskCoverage:'Consider every task and its enclosing source context; a task is not a precomputed expression. Unknown action does not remove its source obligation.',
      branchScope:'Keep branch effects conditional on their source condition; do not promote a branch condition into an unconditional operation precondition.',
      guardProvenance:'Additional business guards need original narrative evidence. Model declarations establish available names and types, not extra business restrictions.',
      referenceVersusMembership:'A non-null service-state object need not be separately present in a repository. Do not replace a current object by an arbitrary instance of the same type.',
      identity:'State candidates, same UML types and advisory relations do not prove shared business identity.',
      language:'Choose operations supported for the actual receiver type. A collection operation is not automatically valid on String; iterator predicates must follow the supplied grammar.',
      joint:'Solve all D/P/Q in one response, reusing consistent definitions where justified. Do not output planning metadata.'},
    semanticCompletenessProven:false,oracleAccess:false};
  return {...body,hash:ccHash(body)};
}
