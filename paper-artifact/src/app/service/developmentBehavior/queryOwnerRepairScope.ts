import {pathContains,type PermissionAst} from '../dependencyRepairAst';
import type {ModelIndex} from '../modelIndex';
import type {RepairDiagnostic} from '../repairDiagnostics';

/** A mismatched query owner needs one coherent scope including its binder and predicate. */
export function queryOwnerRepairScopes(input:{
 nodes:PermissionAst[];regions:PermissionAst[];index:ModelIndex;
 diagnostics:RepairDiagnostic[];obligations:{id:string;clause:string}[];
}){
 const decisions:{region:PermissionAst;obligationIds:string[];modelIds:string[];actualOwner:string;expectedOwner:string;reason:string}[]=[];
 for(const diagnostic of input.diagnostics){
  if(!diagnostic.repairEligible||diagnostic.stage!=='development'||!diagnostic.requirementEvidence?.length)continue;
  const ids=diagnostic.modelEvidence.map(m=>m.id);
  const owners=input.index.entities.filter(e=>e.features.some(f=>ids.includes(f.id)));
  // Several mentioned types do not establish a unique target identity.
  if(owners.length!==1)continue;
  const expected=owners[0];
  for(const region of input.regions){
   const obligations=input.obligations.filter(o=>o.clause===region.clause&&diagnostic.obligationIds.includes(o.id)&&
    diagnostic.requirementEvidence!.some(e=>e.id===o.id));
   if(!obligations.length)continue;
   const iterators=input.nodes.filter(n=>n.clause===region.clause&&n.kind==='RuleIteratorExpCSContext'&&
    pathContains(n.path,region.path)).sort((a,b)=>b.path.length-a.path.length);
   const iterator=iterators[0];if(!iterator)continue;
   const classifier=iterator.children.find(n=>n.kind==='RuleClassiferCallExpCSContext');
   const actual=input.index.entities.find(e=>classifier?.children.some(n=>n.kind==='RuleSimpleNameCSContext'&&n.text===e.name));
   if(!actual||actual.id===expected.id)continue;
   const expression=input.nodes.filter(n=>n.clause===iterator.clause&&n.kind==='RuleAtomicExpressionContext'&&
    pathContains(n.path,iterator.path)).sort((a,b)=>b.path.length-a.path.length)[0];
   if(!expression)continue;
   const parameters=input.index.operation.parameters.filter(p=>ids.includes(p.id));
   const hasParameter=(node:PermissionAst):boolean=>
    (node.kind==='RuleSimpleNameCSContext'&&parameters.some(p=>p.name===node.text))||node.children.some(hasParameter);
   if(!parameters.length||!hasParameter(expression))continue;
   decisions.push({region:expression,obligationIds:obligations.map(o=>o.id),
    modelIds:expected.features.filter(f=>ids.includes(f.id)).map(f=>f.id),actualOwner:actual.id,expectedOwner:expected.id,
    reason:'Source-linked public failure and a unique model-feature owner authorize a query search region including classifier, binder and predicate. This is not a proved business root cause or permission to edit another clause.'});
  }
 }
 return [...new Map(decisions.map(d=>[`${d.region.clause}:${d.region.path.join('.')}:${d.expectedOwner}`,d])).values()];
}
