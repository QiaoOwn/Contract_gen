import type {CandidateAnalysis} from '../repairLocalization';
import type {ModelIndex} from '../modelIndex';
import type {RepairDiagnostic} from '../repairDiagnostics';

/** Explain a witnessed role conflict without synthesizing a selector or extending edit scope. */
export function targetRoleRepairEvidence(diagnostics:RepairDiagnostic[],index:ModelIndex,analysis:CandidateAnalysis){
 if(!analysis?.modelEvidenceComplete)return [];
 const decisions:{entityId:string;identifierId:string;parameterId:string;currentReferenceId:string;
  obligationIds:string[];requirementEvidence:NonNullable<RepairDiagnostic['requirementEvidence']>;instruction:string}[]=[];
 for(const d of diagnostics){
  const evidence=(d.observed as any)?.admissibilityEvidence,selection=evidence?.targetSelection;
  if(d.code!=='UNEXPECTED_REJECTION'||!d.repairEligible||d.stage!=='development'||!d.requirementEvidence?.length||
   evidence?.basis!=='independent-source-precondition-observation'||evidence.timing!=='before-invocation'||evidence.allSatisfied!==true||
   selection?.basis!=='registered-source-identifier-selection'||selection.currentMatchesSelectedTarget!==false)continue;
  if(!d.obligationIds.length||!d.obligationIds.every(id=>evidence.observations?.some((f:any)=>f.obligationId===id&&f.satisfied===true)))continue;
  const entity=index.entities.find(e=>e.name===selection.entity);
  const identifier=entity?.features.find(f=>f.name===selection.identifier);
  const parameter=index.operation.parameters.find(p=>p.name===selection.parameter);
  const state=index.operation.serviceState.find(s=>s.name===selection.currentReference&&s.type.kind==='named'&&s.type.name===entity?.name);
  if(!entity||!identifier||!parameter||!state||!d.modelEvidence.some(m=>m.id===identifier.id)||!d.modelEvidence.some(m=>m.id===parameter.id))continue;
  if(!analysis.evidence.references.some(r=>r.clause==='precondition'&&r.modelElementId===state.id))continue;
  decisions.push({entityId:entity.id,identifierId:identifier.id,parameterId:parameter.id,currentReferenceId:state.id,
   obligationIds:d.obligationIds,requirementEvidence:d.requirementEvidence,
   instruction:'The independently source-valid target is selected by the registered identifier and operation parameter. The pre-invocation current reference is a different object in the witnessed admissible execution. It is not a substitute for that target. Reconsider the admission expression using these distinct roles, preserving every cited source condition. Do not remove target existence or state requirements, or edit protected clauses. No selector expression or unique root cause is supplied.'});
 }
 return [...new Map(decisions.map(d=>[`${d.entityId}:${d.parameterId}:${d.currentReferenceId}`,d])).values()];
}
