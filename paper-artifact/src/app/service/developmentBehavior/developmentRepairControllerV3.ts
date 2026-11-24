import {repairControllerV3} from '../dependencyRepairPolicyV3';
import {compactRepairJson} from '../dependencyRepairPolicyV2';
import {permissionAst,astStructureHash,samePath,type PermissionAst} from '../dependencyRepairAst';
import {auditCollaborative25} from '../crossClauseCollaborative25';
import {auditRepairExecutionSafety} from '../repairExecutionSafety';
import {ccHash} from '../crossClauseGraph';
import {assessDevelopmentCandidate} from './assessDevelopmentCandidate';
import {narrativeDevelopmentProfile} from './narrativeDevelopmentProfiles';
import type {PermissionInput} from '../dependencyRepairPermissions';
import type {RepairCandidate} from '../repairLocalization';
import {analyzeRepairCandidate} from '../repairLocalization';
import type {RepairDiagnostic} from '../repairDiagnostics';
import {queryOwnerRepairScopes} from './queryOwnerRepairScope';
import {creationLifetimeRepairScopes,auditCreationRelocation} from './creationLifetimeRepairScope';
import {iteratorEffectRepairScopes} from './iteratorEffectRepairScope';
import {auditAuthorizedConjunctEdits} from './authorizedConjunctEdits';
import {targetRoleRepairEvidence} from './targetRoleRepairEvidence';
import {collectionScopeRepairEvidence} from './collectionScopeRepairEvidence';

const resultExpressions=(nodes:PermissionAst[])=>nodes.filter(n=>n.clause==='postcondition'&&n.kind==='RuleAtomicExpressionContext'&&
 n.children[0]?.kind==='RuleLeftSubAtomicExpressionContext'&&n.children[0].children.some(c=>c.kind==='RuleVariableExpCSContext'&&c.text==='result')).map(astStructureHash);

export function witnessedFalseAdmission(feedback:RepairDiagnostic[],sourcePreconditions:string[]){
 return feedback.some(d=>{
  const observed=d.observed as any,e=observed?.preconditionEvidence;
  return d.code==='OBLIGATION_MISMATCH'&&d.repairEligible&&observed?.outcome==='normal return'&&
   e?.basis==='independent-source-precondition-observation'&&e.timing==='before-invocation'&&e.satisfied===false&&
   d.obligationIds.length>0&&d.obligationIds.every(id=>sourcePreconditions.includes(id))&&
   d.requirementEvidence?.some(r=>d.obligationIds.includes(r.id));
 });
}

/** Separate opt-in controller: observations can be installed only by its evaluator. */
export function developmentRepairControllerV3(base:{role:string;content:string}[],
 makeInput:(candidate:RepairCandidate,diagnostics:RepairDiagnostic[],previous?:RepairCandidate)=>PermissionInput,
 requirement:string,options:{jointTargetRepair?:boolean}={}){
 const ordinary=repairControllerV3(base,makeInput);
 const observations=new Map<string,Awaited<ReturnType<typeof assessDevelopmentCandidate>>>();
 const authority=new WeakMap<object,{hash:string;input:PermissionInput;before:ReturnType<typeof permissionAst>}>();
 const evaluate=async(candidate:RepairCandidate,entry:string|undefined,preExecValid:boolean)=>{
  const context=makeInput(candidate,[]).context;
  const result=await assessDevelopmentCandidate({enabled:true,preExecValid,entry,requirement,candidate,context});
  observations.set(ccHash(candidate),structuredClone(result));return result;
 };
 const prepare=(candidate:RepairCandidate,diagnostics:RepairDiagnostic[],previous?:RepairCandidate)=>{
  const observation=observations.get(ccHash(candidate));
  if(!observation||observation.status!=='FAIL'){
   if(diagnostics.some(d=>d.stage==='development'))return {blocked:true,plan:{reason:'No program-owned development failure authorizes repair'},messages:base};
   return ordinary.prepare(candidate,diagnostics,previous);
  }
  const input=makeInput(candidate,[],previous),before=permissionAst(candidate,input.context);
  const feedback=observation.feedbackDiagnostics;
  const index=input.context.index;
  const profile=narrativeDevelopmentProfile(`${index.project}_${index.useCase}_${index.operation.name}`,requirement);
  const sourcePreconditions=profile?.obligations.filter(o=>o.clause==='precondition').map(o=>o.id)??[];
  const analysis=analyzeRepairCandidate(candidate,input.context);
  const operationCall=(n:PermissionAst):boolean=>['RuleStandardNavigationCallExpCSContext','RuleStandardDateOperationContext'].includes(n.kind)||n.children.some(operationCall);
  // A feature access alone excludes the surrounding operator that may be wrong.
  // Authorize its smallest enclosing atomic expression, not the entire clause.
  const regions=feedback.flatMap(d=>[
   ...[...(d.localization?.candidates??[]),...(analysis?.modelEvidenceComplete?analysis.evidence.references.filter(ref=>
    d.modelEvidence.some(model=>model.id===ref.modelElementId)&&profile?.obligations.some(o=>d.obligationIds.includes(o.id)&&o.clause===ref.clause)):[])].flatMap(site=>{
    const atoms=before.nodes.filter(n=>n.kind==='RuleAtomicExpressionContext'&&
     (n.children.some(c=>['RuleInfixCompareOperatorNameContext','RuleInfixOperatorNameContext'].includes(c.kind))||operationCall(n))&&n.location&&n.clause===site.clause&&
     n.location.startOffset<=site.startOffset&&n.location.endOffset>=site.endOffset)
     .sort((a,b)=>(a.location!.endOffset-a.location!.startOffset)-(b.location!.endOffset-b.location!.startOffset));
    return atoms.length?[atoms[0]]:[];
   }),
   ...(d.localization?.gaps??[]).flatMap(g=>before.nodes.filter(n=>n.location&&n.clause===g.clause&&
    n.location.startOffset===g.searchRegion.startOffset&&n.location.endOffset===g.searchRegion.endOffset))
  ]);
  const witnessedScopes=feedback.flatMap(d=>{
   const observed=d.observed as any,evidence=observed?.admissibilityEvidence;
   if(d.code!=='UNEXPECTED_REJECTION'||evidence?.basis!=='independent-source-precondition-observation'||
    evidence.timing!=='before-invocation'||evidence.allSatisfied!==true||
    !sourcePreconditions.length||!sourcePreconditions.every(id=>evidence.obligationIds?.includes(id)&&evidence.observations?.some((o:any)=>o.obligationId===id&&o.satisfied===true))||
    !d.obligationIds.length||!d.obligationIds.every(id=>sourcePreconditions.includes(id)&&evidence.obligationIds?.includes(id)))return [];
   const scopes:PermissionAst[]=before.roots.precondition?[before.roots.precondition]:[];
   const origin=observed.oclOrigin;
   if(origin?.clause==='definition'&&typeof origin.binding==='string'){
    const bindings=before.nodes.filter(n=>n.clause==='definition'&&n.kind==='RuleVariableDeclarationCSContext'&&n.children[0]?.text===origin.binding);
    if(bindings.length===1)scopes.push(bindings[0]);
   }
   return scopes;
  });
  regions.push(...witnessedScopes);
  for(const d of feedback.filter(d=>['PUBLIC_RUNTIME_DEREFERENCE','PUBLIC_RUNTIME_PREDICATE'].includes(d.code))){
   const matches=before.nodes.filter(n=>n.clause===d.location.clause&&n.kind==='RuleAtomicExpressionContext'&&
    n.location?.line===d.location.line&&n.location?.column===d.location.column&&d.candidateScopes?.some(s=>s.expression===n.text));
   if(matches.length===1)regions.push(matches[0]);
  }
  // False admission is evidence about P, not permission to rewrite effects or D.
  const falseAdmission=witnessedFalseAdmission(feedback,sourcePreconditions);
  if(falseAdmission&&before.roots.precondition)regions.push(before.roots.precondition);
  const queryScopes=queryOwnerRepairScopes({nodes:before.nodes,regions,index,diagnostics:feedback,obligations:profile?.obligations??[]});
  regions.push(...queryScopes.map(d=>d.region));
  const effectScopes=iteratorEffectRepairScopes({nodes:before.nodes,regions,analysis,diagnostics:feedback,obligations:profile?.obligations??[]});
  regions.push(...effectScopes.map(d=>d.region));
  const lifecycleOptions=creationLifetimeRepairScopes(candidate,input.context,before,feedback);
  const targetRoleEvidence=targetRoleRepairEvidence(feedback,index,analysis);
  const collectionScopeEvidence=collectionScopeRepairEvidence(candidate,input.context,feedback);
  const jointAdmissionEvidence=feedback.filter(d=>{
   const e=(d.observed as any)?.admissibilityEvidence;
   return d.stage==='development'&&d.repairEligible&&d.code==='UNEXPECTED_REJECTION'&&
    e?.basis==='independent-source-precondition-observation'&&e.timing==='before-invocation'&&e.allSatisfied===true&&
    sourcePreconditions.length>0&&sourcePreconditions.every(id=>e.observations?.some((f:any)=>f.obligationId===id&&f.satisfied===true))&&
    d.requirementEvidence?.some(r=>d.obligationIds.includes(r.id))&&
    d.obligationIds.length>0&&d.obligationIds.every(id=>sourcePreconditions.includes(id));
  }).map(d=>({obligationIds:d.obligationIds,requirementEvidence:d.requirementEvidence,
   instruction:'All registered source admission conditions were independently satisfied before invocation, yet this candidate rejected the invocation. Joint D/P/Q search is permitted to resolve possible shared selector, association or temporal dependencies. This does not establish a Q defect or unique cause. Preserve all source obligations, protected results and unrelated Definition declarations; revalidate the entire candidate.'}));
  const jointEffectEvidence=feedback.filter(d=>d.stage==='development'&&d.repairEligible&&d.code==='OBLIGATION_MISMATCH'&&
   d.modelEvidence.length>0&&d.requirementEvidence?.some(e=>d.obligationIds.includes(e.id)&&profile?.obligations.some(o=>o.id===e.id&&o.clause==='postcondition'))&&
   d.observed!==undefined&&d.observed!==null&&(typeof d.observed!=='object'||'stateObservation' in d.observed)
  ).map(d=>({obligationIds:d.obligationIds,modelEvidence:d.modelEvidence,requirementEvidence:d.requirementEvidence,
   instruction:'A source-linked public state observation differs from the required effect. Joint D/P/Q search is authorized to repair creation, selection and dependent effects. The observation does not establish a unique cause or permit changing the requirements. Preserve protected results and unrelated Definition declarations; revalidate all admission and effect scenarios.'}));
  const jointTargetRepair=options.jointTargetRepair===true&&(targetRoleEvidence.length>0||collectionScopeEvidence.length>0||jointAdmissionEvidence.length>0||jointEffectEvidence.length>0);
  const returnRepair=feedback.some(d=>d.repairEligible&&d.obligationKinds?.includes('result')&&
   d.requirementEvidence?.some(e=>d.obligationIds.includes(e.id)&&profile?.obligations.some(o=>o.id===e.id&&o.clause==='postcondition')));
  const unique=[...new Map(regions.map(n=>[`${n.clause}:${n.path.join('.')}`,n])).values()];
  const plan={version:'public-development-ast-repair-v1',candidateHash:ccHash(candidate),
   observationHash:ccHash(observation),mayEdit:unique.map(n=>({clause:n.clause,path:n.path,expression:n.text})),
   mustRevalidate:['definition','precondition','postcondition'],
   protection:'All AST outside authorized regions is protected. Dependency alone grants no edit permission.',
   jointTargetRepair:jointTargetRepair?{policy:'source-witnessed-joint-target-search-v1',
    clauses:['definition','precondition','postcondition'],evidence:[...targetRoleEvidence,...collectionScopeEvidence,...jointAdmissionEvidence,...jointEffectEvidence],
    instruction:'A source-witnessed target role conflict authorizes a joint D/P/Q search. You may introduce a typed target binding and coordinate its consumers. Preserve source obligations, protected result expressions and existing unrelated Definition declarations. This broader search permission is not a semantic proof; the full candidate must pass independent checks.'}:null,
   admissibilityScopePolicy:'An independently witnessed rejection of a source-valid input may authorize the admission clause as a search region. Runtime-origin evidence may additionally authorize one exact Definition binding. Root cause is not assumed; all registered rejection scenarios must be revalidated.',
   diagnostics:feedback,lifecycleOptions,targetRoleEvidence,collectionScopeEvidence,protectedResultExpressions:returnRepair?null:resultExpressions(before.nodes)};
  Object.assign(plan,{scopeDecisions:[...queryScopes,...effectScopes].map(({region,...evidence})=>({...evidence,clause:region.clause,path:region.path}))});
  authority.set(plan,{hash:ccHash(plan),input,before});
  return {blocked:!before.parsed||(!unique.length&&!lifecycleOptions.length&&!jointTargetRepair),plan,messages:[...base,{role:'user',content:JSON.stringify({currentContract:candidate,developmentRepairDirective:compactRepairJson(plan,base),
   instruction:'If jointTargetRepair is present, follow its joint search authorization. Otherwise choose ONE option: repair only mayEdit AST regions; OR apply one lifecycleOptions binding relocation exactly as specified. Do not combine the latter options. Preserve all unrelated structure. When protectedResultExpressions is non-null, preserve the current result expressions even inside a broad editable search region. Return complete D/P/Q in the existing protocol. These are finite public development observations, not hidden test feedback.'})}]};
 };
 const audit=(candidate:RepairCandidate,value:unknown)=>{
  if(!value||typeof value!=='object')throw Error('Missing repair authority');
  const authorized=authority.get(value);
  if(!authorized){
   if((value as any).version==='public-development-ast-repair-v1')throw Error('Unknown development permission authority');
   return ordinary.audit(candidate,value);
  }
  if(ccHash(value)!==authorized.hash)throw Error('Development permissions were mutated');
  const plan=value as ReturnType<typeof prepare>['plan'];
  if(!('mayEdit' in plan))throw Error('Invalid development permission');
  if(ccHash(authorized.input.candidate)!==plan.candidateHash)throw Error('Development baseline mutated');
  const next=permissionAst(candidate,authorized.input.context),unauthorized:{clause:string;path:number[]}[]=[];
  const compare=(before:PermissionAst|undefined,after:PermissionAst|undefined,clause:string,path:number[])=>{
   if(astStructureHash(before)===astStructureHash(after))return;
   if(plan.mayEdit.some(r=>r.clause===clause&&samePath(r.path,path)))return;
   if(before&&after&&before.children.length!==after.children.length&&auditAuthorizedConjunctEdits(before,after,plan.mayEdit))return;
   if(!before||!after||before.kind!==after.kind||before.children.length!==after.children.length||!before.children.length){unauthorized.push({clause,path});return;}
   before.children.forEach((child,i)=>compare(child,after.children[i],clause,[...path,i]));
  };
  for(const clause of ['definition','precondition','postcondition'] as const)compare(authorized.before.roots[clause],next.roots[clause],clause,[]);
  const relocation=next.parsed?auditCreationRelocation(authorized.before,next,plan.lifecycleOptions):{passed:false};
  const protectedResultPassed=plan.protectedResultExpressions===null||ccHash(plan.protectedResultExpressions)===ccHash(resultExpressions(next.nodes));
  const oldDeclarations=authorized.before.roots.definition?.children.filter(n=>n.kind==='RuleVariableDeclarationCSContext')??[];
  const nextDeclarations=next.roots.definition?.children.filter(n=>n.kind==='RuleVariableDeclarationCSContext')??[];
  const editableDefinitionPaths=plan.jointTargetRepair?plan.collectionScopeEvidence.map(e=>e.declarationPath):[];
  const preservedDefinitions=oldDeclarations.every(old=>editableDefinitionPaths.some(p=>p&&samePath(p,old.path))||nextDeclarations.some(n=>astStructureHash(n)===astStructureHash(old)));
  const jointPassed=!!plan.jointTargetRepair&&preservedDefinitions;
  const scopePassed=next.parsed&&protectedResultPassed&&(!unauthorized.length||relocation.passed||jointPassed);
  const input=authorized.input,cross=auditCollaborative25({plan:input.plan,context:input.context,candidate,previous:input.candidate},input.pack);
  const safety=auditRepairExecutionSafety(candidate,input.context);
  return {passed:scopePassed,acceptanceBlocked:!scopePassed||cross.blocked||!!safety.issues.length,
   feedbackDiagnostics:cross.diagnostics,details:{unauthorized,relocation,jointPassed,preservedDefinitions,protectedResultPassed,cross,safety,permissionSource:'program-owned-public-development-observation'}};
 };
 return {evaluate,prepare,audit};
}
