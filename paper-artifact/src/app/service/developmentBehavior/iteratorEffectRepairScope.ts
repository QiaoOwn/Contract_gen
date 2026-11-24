import {pathContains,type PermissionAst} from '../dependencyRepairAst';
import type {CandidateAnalysis} from '../repairLocalization';
import type {RepairDiagnostic} from '../repairDiagnostics';

/** A witnessed effect can be trapped inside a predicate-only iterator wrapper. */
export function iteratorEffectRepairScopes(input:{nodes:PermissionAst[];regions:PermissionAst[];
 analysis:CandidateAnalysis;diagnostics:RepairDiagnostic[];obligations:{id:string;clause:string}[]}){
 if(!input.analysis?.modelEvidenceComplete)return [];
 const decisions:{region:PermissionAst;obligationIds:string[];modelIds:string[];reason:string}[]=[];
 for(const diagnostic of input.diagnostics){
  if(diagnostic.stage!=='development'||!diagnostic.repairEligible||diagnostic.code!=='OBLIGATION_MISMATCH'||
   !diagnostic.requirementEvidence?.length||!diagnostic.obligationKinds?.some(k=>['attribute','association','service-state','state-transition'].includes(k)))continue;
  const obligations=input.obligations.filter(o=>o.clause==='postcondition'&&diagnostic.obligationIds.includes(o.id)&&diagnostic.requirementEvidence!.some(e=>e.id===o.id));
  if(!obligations.length)continue;
  const ids=diagnostic.modelEvidence.map(m=>m.id);
  for(const region of input.regions.filter(n=>n.clause==='postcondition')){
   const references=input.analysis.evidence.references.filter(ref=>ids.includes(ref.modelElementId)&&ref.clause===region.clause&&region.location&&
    ref.startOffset>=region.location.startOffset&&ref.endOffset<=region.location.endOffset);
   if(!references.length)continue;
   const iterator=input.nodes.filter(n=>n.clause===region.clause&&n.kind==='RuleIteratorExpCSContext'&&pathContains(n.path,region.path))
    .sort((a,b)=>b.path.length-a.path.length)[0];
   const iteratorKind=iterator?.children.find(n=>n.kind==='RuleIteratorIdentifierContext')?.text;
   if(!iterator||!['exists','one'].includes(iteratorKind??''))continue;
   const wrapper=input.nodes.filter(n=>n.clause===region.clause&&n.kind==='RuleAtomicExpressionContext'&&pathContains(n.path,iterator.path))
    .sort((a,b)=>b.path.length-a.path.length)[0];
   if(!wrapper)continue;
   decisions.push({region:wrapper,obligationIds:obligations.map(o=>o.id),modelIds:[...new Set(references.map(r=>r.modelElementId))],
    reason:`A source-linked public effect mismatch resolves to model references inside this ${iteratorKind} predicate. Authorize the smallest enclosing iterator expression as a search region, including its local binding and body; no D/P or sibling Q edit is authorized. This is not proof of the unique root cause.`});
  }
 }
 return [...new Map(decisions.map(d=>[d.region.path.join('.'),d])).values()];
}
