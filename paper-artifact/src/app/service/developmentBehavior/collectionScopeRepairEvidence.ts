import {analyzeRepairCandidate,type RepairCandidate} from '../repairLocalization';
import {permissionAst} from '../dependencyRepairAst';
import type {OperationModelGrounding} from '../operationModelGrounding';
import type {RepairDiagnostic} from '../repairDiagnostics';

/** Shared collection accesses are search-scope evidence, not proved semantic equivalence. */
export function collectionScopeRepairEvidence(candidate:RepairCandidate,context:OperationModelGrounding,diagnostics:RepairDiagnostic[]){
 const analysis=analyzeRepairCandidate(candidate,context),ast=permissionAst(candidate,context);
 if(!analysis?.modelEvidenceComplete||!ast.parsed)return [];
 const decisions:any[]=[];
 for(const d of diagnostics){
  const observed=d.observed as any,evidence=observed?.admissibilityEvidence,origin=observed?.oclOrigin;
  if(d.stage!=='development'||!d.repairEligible||d.code!=='UNEXPECTED_REJECTION'||!d.requirementEvidence?.length||
   evidence?.basis!=='independent-source-precondition-observation'||evidence.timing!=='before-invocation'||evidence.allSatisfied!==true||
   origin?.clause!=='definition'||typeof origin.binding!=='string'||!d.obligationIds.length||
   !d.obligationIds.every(id=>evidence.observations?.some((f:any)=>f.obligationId===id&&f.satisfied===true)))continue;
  const bindings=analysis.evidence.bindings.filter(b=>b.name===origin.binding&&b.declaration?.clause==='definition');
  if(bindings.length!==1)continue;
  const binding=bindings[0],site=binding.declaration!;
  const declaration=ast.nodes.find(n=>n.clause==='definition'&&n.kind==='RuleVariableDeclarationCSContext'&&n.location?.startOffset===site.startOffset&&n.location?.endOffset===site.endOffset);
  const type=declaration?.children.find(n=>n.kind==='RuleTypeCSContext')?.text;
  const entity=context.index.entities.find(e=>e.name===type);if(!entity)continue;
  if(!d.modelEvidence.some(m=>entity.features.some(f=>f.id===m.id))||
   !context.index.operation.parameters.some(p=>binding.dependsOn.includes(p.id)&&d.modelEvidence.some(m=>m.id===p.id)))continue;
  const collections=context.index.entities.flatMap(e=>e.features).filter(f=>f.type.kind==='set'&&f.type.element?.kind==='named'&&f.type.element.name===entity.name);
  for(const collection of collections){
   const refs=analysis.evidence.references.filter(r=>r.modelElementId===collection.id);
   if(!refs.some(r=>r.clause==='definition'&&r.startOffset>=site.startOffset&&r.endOffset<=site.endOffset)||
    !refs.some(r=>r.clause==='precondition')||!refs.some(r=>r.clause==='postcondition')||
    !binding.uses.some(u=>u.clause==='postcondition'))continue;
   decisions.push({bindingId:binding.id,declarationPath:declaration!.path,modelId:entity.id,collectionId:collection.id,obligationIds:d.obligationIds,
    requirementEvidence:d.requirementEvidence,locations:refs,
    instruction:'An independently source-valid invocation failed in this Definition binding. The same typed collection declaration is referenced in D, P and Q, and the resolved binding is consumed in Q. Jointly reconsider the lookup, admission and effect collection scopes. Preserve all source obligations and protected return expressions. Shared access establishes a repair search region, not a correct replacement collection or unique root cause. No target OCL is supplied.'});
  }
 }
 return [...new Map(decisions.map(d=>[`${d.bindingId}:${d.collectionId}`,d])).values()];
}
