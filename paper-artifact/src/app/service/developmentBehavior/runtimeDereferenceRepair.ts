import {permissionAst} from '../dependencyRepairAst';
import type {RepairCandidate} from '../repairLocalization';
import type {OperationModelGrounding} from '../operationModelGrounding';
import type {RepairDiagnostic} from '../repairDiagnostics';
import type {DevelopmentBehaviorReport} from './types';
import {analyzeRepairCandidate} from '../repairLocalization';
import {modelDeclarations} from '../modelDeclarations';

/** Technical search scopes from public runtime evidence, never a business verdict. */
export function runtimeDereferenceDiagnostics(report:DevelopmentBehaviorReport,candidate:RepairCandidate,context:OperationModelGrounding):RepairDiagnostic[]{
 const ast=permissionAst(candidate,context);if(!ast.parsed)return [];
 return report.diagnostics.flatMap(d=>{
  const observed=d.observed as any;
  const property=/^Cannot read properties of (?:undefined|null) \(reading '([A-Za-z_]\w*)'\)$/.exec(observed?.message??'')?.[1];
  const clause=observed?.oclOrigin?.clause;
  const phaseMatches=clause==='postcondition'&&observed?.oclOrigin?.phase==='effect';
  if(d.code!=='EXECUTION_ERROR'||observed?.name!=='TypeError'||!property||
   !phaseMatches)return [];
  const states=context.index.operation.serviceState.filter(s=>ast.nodes.some(n=>n.clause===clause&&
   n.kind==='RulePropertyCallExpCSContext'&&n.text===`self.${s.name}.${property}`));
  const analysis=analyzeRepairCandidate(candidate,context);
  const paths=ast.nodes.filter(n=>n.clause===clause&&n.kind==='RulePropertyCallExpCSContext'&&n.text.endsWith(`.${property}`)&&n.location);
  const references=analysis?.modelEvidenceComplete?analysis.evidence.references:[];
  const grounded=paths.filter(n=>references.some(r=>r.clause===clause&&r.startOffset>=n.location!.startOffset&&r.endOffset<=n.location!.endOffset));
  const uniquePaths=[...new Map(grounded.map(n=>[n.text,n])).values()];
  const target=states.length===1?`self.${states[0].name}.${property}`:uniquePaths.length===1?uniquePaths[0].text:null;
  if(!target)return [];
  const nodes=ast.nodes.filter(n=>n.clause===clause&&n.kind==='RuleAtomicExpressionContext'&&
   n.text.includes(target));
  const smallest=nodes.filter(n=>!nodes.some(m=>m!==n&&m.location&&n.location&&
   m.location.startOffset>=n.location.startOffset&&m.location.endOffset<=n.location.endOffset&&m.text.length<n.text.length));
  if(smallest.length!==1||!smallest[0].location)return [];
  const n=smallest[0],state=states.length===1?states[0]:null;
  const ids=new Set(references.filter(r=>n.location&&r.clause===clause&&r.startOffset>=n.location.startOffset&&r.endOffset<=n.location.endOffset).map(r=>r.modelElementId));
  const evidence=state?[{id:state.id,declaration:`${state.name}: ${state.type.raw}`,source:state.source}]:modelDeclarations(context.index).filter(d=>ids.has(d.id)).map(({id,declaration,source})=>({id,declaration,source}));
  if(!evidence.length)return [];
  return [{stage:'development',classification:{version:'evidence-guided-repair-taxonomy-v2',family:'UNK',evidenceKind:'runtime-failure',disposition:'repair-candidate'},
   category:'execution',code:'PUBLIC_RUNTIME_DEREFERENCE',msg:`Public ${observed.oclOrigin.phase} execution failed at ${n.text}: ${observed.message}. Root cause is not a proven business defect.`,
   repairEligible:true,obligationIds:[],ruleIds:[],modelEvidence:evidence,
   location:{resolution:'ocl-expression',clause,line:n.location!.line,column:n.location!.column},
   candidateScopes:[{clause,expression:n.text}],observed,
   repair:'Reformulate this failing expression within the unchanged requirement and model. Preserve every required effect; do not add existence preconditions, delete required obligations or specialize to test values.'} as RepairDiagnostic];
 });
}

/** Exact expression carried by a public PostconditionError is localization,
 * not evidence that the required effect or the backend semantics are wrong. */
export function runtimePredicateDiagnostics(report:DevelopmentBehaviorReport,candidate:RepairCandidate,context:OperationModelGrounding):RepairDiagnostic[]{
 const ast=permissionAst(candidate,context);if(!ast.parsed)return [];
 return report.diagnostics.flatMap(d=>{
  const observed=d.observed as any;
  if(d.code!=='EXECUTION_ERROR'||observed?.name!=='PostconditionError')return [];
  const expression=/^Postcondition validation failed: \(Build Failed - (.*)\)$/.exec(observed.message??'')?.[1];
  if(!expression)return [];
  const matches=ast.nodes.filter(n=>n.clause==='postcondition'&&n.kind==='RuleAtomicExpressionContext'&&n.text===expression&&n.location);
  if(matches.length!==1)return [];
  const n=matches[0];
  return [{stage:'development',classification:{version:'evidence-guided-repair-taxonomy-v2',family:'UNK',evidenceKind:'runtime-failure',disposition:'repair-candidate'},
   category:'execution',code:'PUBLIC_RUNTIME_PREDICATE',msg:`Public postcondition execution rejected this exact expression: ${expression}. This identifies a search site, not a unique cause.`,
   repairEligible:true,obligationIds:[],ruleIds:[],modelEvidence:[],observed,
   location:{resolution:'ocl-expression',clause:'postcondition',line:n.location!.line,column:n.location!.column},
   candidateScopes:[{clause:'postcondition',expression:n.text}],
   repair:'Inspect binding, effect order and supported representation at this exact site. Preserve required effects and source conditions; do not delete obligations to silence the check.'} as RepairDiagnostic];
 });
}
