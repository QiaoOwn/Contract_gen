import {generateContractCode,parse} from '../util';
import {planRepairV2,auditRepairV2,compactRepairJson,repairOptionViewsV2} from './dependencyRepairPolicyV2';
import {sameOclTokens} from './oclTokenIdentity';
import type {PermissionInput} from './dependencyRepairPermissions';
import type {RepairCandidate} from './repairLocalization';
import {auditCollaborative25} from './crossClauseCollaborative25';
import {ccHash} from './crossClauseGraph';
import {auditRepairExecutionSafety} from './repairExecutionSafety';
import {expandTransparentRepairAliases} from './transparentRepairAliases';
import {permissionAst,pathContains,astStructureHash,type PermissionAst} from './dependencyRepairAst';
import {validateModelGroundedContract} from './validateModelGroundedContract';
import {unifyStaticDiagnostics} from './repairDiagnostics';

const clauses=['definition','precondition','postcondition'] as const;
/** Parser probes establish only local syntax evidence, never business obligations. */
export function planRepairV3(input:PermissionInput){
 const op=input.context.index.operation;
 const probes=clauses.filter(c=>c!=='definition'||!!input.candidate.definition).map(clause=>{
  const candidate={definition:'',precondition:'true',postcondition:'true', [clause]:input.candidate[clause]};
  const text=generateContractCode({serviceName:op.service,operationName:op.name,
   parameters:op.parameters.map(p=>({name:p.name,type:p.type.raw})),returnedType:op.returnType?.type.raw,...candidate});
  const parsed=parse(text);
  return {clause,candidateFieldHash:ccHash(input.candidate[clause]),probeContract:text,errors:parsed.errors,
   syntaxValid:!!parsed.tree&&!parsed.errors.length,scope:'Clause syntax in neutral shell; no type/identity/requirement proof'};
 });
 const originalParsed=parse(generateContractCode({serviceName:op.service,operationName:op.name,
  parameters:op.parameters.map(p=>({name:p.name,type:p.type.raw})),returnedType:op.returnType?.type.raw,...input.candidate}));
 const modelDiagnostics=originalParsed.tree&&!originalParsed.errors.length
  ?unifyStaticDiagnostics('model',validateModelGroundedContract({tree:originalParsed.tree,context:input.context}).diagnostics):[];
 const supplied=input.validatorDiagnostics??[];
 const additional=modelDiagnostics.filter(d=>!supplied.some(s=>s.code===d.code&&s.location.clause===d.location.clause&&s.location.line===d.location.line&&s.location.column===d.location.column));
 const base=planRepairV2({...input,validatorDiagnostics:[...supplied,...additional]});
 // Complete-contract syntax failures alone activate the independently evidenced fallback.
 const authorizedClauses=originalParsed.errors.length?probes.filter(p=>!p.syntaxValid).map(p=>p.clause):[];
 const fullSafety=auditRepairExecutionSafety(input.candidate,input.context);
 // A broken sibling clause must not hide a locally witnessed execution hazard.
 const safety=fullSafety.parsed?fullSafety:{...fullSafety,issues:probes.filter(p=>p.syntaxValid&&p.clause!=='definition').flatMap(p=>{
  const shell={definition:probes.find(p=>p.clause==='definition')?.syntaxValid?input.candidate.definition:'',precondition:'true',postcondition:'true',[p.clause]:input.candidate[p.clause]};
  return auditRepairExecutionSafety(shell,input.context).issues.map(issue=>({...issue,evidence:issue.evidence+' Detected in a neutral sibling-clause shell; location belongs to that probe.',probeContract:generateContractCode({serviceName:op.service,operationName:op.name,parameters:op.parameters.map(p=>({name:p.name,type:p.type.raw})),returnedType:op.returnType?.type.raw,...shell})}));
 })};
 const executionEditClauses=[...new Set(safety.issues.map(i=>i.clause as typeof clauses[number]))];
 const ast=permissionAst(input.candidate,input.context);
 const predicateTransitions=ast.nodes.filter(n=>n.clause==='postcondition'&&n.kind==='RuleIteratorExpCSContext'&&
  ['one','exists'].includes(n.children.find(c=>c.kind==='RuleIteratorIdentifierContext')?.text??'')).flatMap(iterator=>
   ast.nodes.filter(n=>n.kind==='RuleAtomicExpressionContext'&&n.clause==='postcondition'&&pathContains(iterator.path,n.path)&&
    n.children.some(c=>c.kind==='RuleInfixOperatorNameContext'||c.kind==='RuleInfixCompareOperatorNameContext')&&
    n.children[0]?.text&&n.text.includes(`${n.children[0].text}@pre`))
    .map(n=>({iterator:iterator.text,expression:n.text,location:n.location,
     basis:'Parsed post-state equality references the same property at entry state inside a predicate-only iterator. The backend evaluates this body as a predicate, not an assignment.',
     instruction:'This is an executable representation risk, not proof of a missing business obligation. Keep selector predicates read-only; if the cited requirement demands an update, bind the selected object and express the required effects outside one/exists. Preserve all source guards and effects.'})));
 // A lowering failure is not proof of a business defect. It can nevertheless
 // authorize a representation repair when the actual receiver is model-grounded.
 const receiverFailure=(input.validatorDiagnostics??[]).some(d=>(d.stage==='lowering'&&
  /Cannot determine the OCL type of self for oclIsNew\(\)/.test(d.msg??''))||
  (d.stage==='model'&&d.code==='STATE_REQUIRES_SELF'&&d.repairEligible&&d.modelEvidence.length>0));
 const receiverEvidence=receiverFailure&&ast.parsed
  ?ast.nodes.filter(n=>n.clause==='postcondition'&&n.kind==='RuleStandardOperationExpCSContext'&&
   input.context.index.operation.serviceState.some(s=>n.text===`self.${s.name}.oclIsNew()`||n.text===`${s.name}.oclIsNew()`))
   .map(n=>({expression:n.text,location:n.location,basis:'Parsed direct service-state receiver; declared by authoritative operation model'})):[];
 const representationEditClauses=receiverEvidence.length?['definition','postcondition'] as const:[];
 const receiverDiagnostics=modelDiagnostics.filter(d=>d.code==='STATE_REQUIRES_SELF'&&d.modelEvidence.length>0);
 const searchClauses=[...new Set(receiverDiagnostics.map(d=>d.location.clause).filter((c):c is typeof clauses[number]=>!!c))];
 const transitionSearch=predicateTransitions.length>0&&(modelDiagnostics.length>0||supplied.some(d=>d.repairEligible&&d.stage==='typescript'));
 const modelRepresentationOption=ast.parsed&&(searchClauses.length||transitionSearch)?{
  clauses:transitionSearch?['precondition','postcondition'] as typeof searchClauses:searchClauses,allowNewDefinition:!input.candidate.definition?.trim(),
  evidence:[...receiverDiagnostics.map(d=>({code:d.code,location:d.location,modelEvidence:d.modelEvidence})),
   ...(transitionSearch?predicateTransitions.map(d=>({code:'PREDICATE-TRANSITION-REPRESENTATION',location:d.location,modelEvidence:[],expression:d.expression,basis:d.basis})):[])],
  instruction:'Jointly reformulate the diagnosed clauses using authoritative typed receivers. A new typed Definition may be introduced only when Definition was empty. Preserve existing declarations and unchanged result expressions. Keep every source requirement; this authorizes representation search, not semantic acceptance. Use supported bindings for nested navigation rather than repeating an unparseable chain.'}:null;
 const modelRepairRegions=modelDiagnostics.flatMap(d=>ast.nodes.filter(n=>n.location&&n.clause===d.location.clause&&
  d.candidateScopes?.some(s=>s.expression===n.text)&&n.location.line===d.location.line&&n.location.column===d.location.column)
  .sort((a,b)=>a.text.length-b.text.length||b.path.length-a.path.length).slice(0,1).map(n=>{
   const atomic=ast.nodes.filter(p=>p.clause===n.clause&&p.kind==='RuleAtomicExpressionContext'&&pathContains(p.path,n.path))
    .sort((a,b)=>b.path.length-a.path.length)[0];
   const region=atomic??n;
   return {clause:region.clause,path:region.path,diagnosticCode:d.code,expression:region.text,
    basis:'Smallest enclosing parsed atomic expression for an independently recomputed authoritative-model diagnostic; sibling expressions remain protected'};
  }));
 const payload={version:'dependency-repair-policy-v3' as const,sourceInput:input,base,probes,authorizedClauses,safety,executionEditClauses,receiverEvidence,representationEditClauses,modelRepairRegions,predicateTransitions,modelRepresentationOption,
  blocked:base.blocked&&!authorizedClauses.length&&!executionEditClauses.length&&!representationEditClauses.length&&!modelRepresentationOption,candidateHash:ccHash(input.candidate),planHash:input.plan.hash,packageHash:input.pack.hash};
 return {...payload,hash:ccHash({base:base.hash,probes,authorizedClauses,safety,candidateHash:payload.candidateHash})};
}
export function auditRepairV3(plan:ReturnType<typeof planRepairV3>,candidate:RepairCandidate){
 // V2 enriches diagnostics with inferred clauses. Replay the original input so
 // the same inference evidence is produced, rather than inferring twice.
 const input=plan.sourceInput;
 if(ccHash(planRepairV3(input))!==ccHash(plan))throw Error('V3 permission differs from independently reconstructed program evidence');
 if(ccHash(input.candidate)!==plan.candidateHash)throw Error('Repair baseline mutated');
 const ordinary=auditRepairV2(plan.base,candidate);
 const safety=auditRepairExecutionSafety(candidate,input.context);
 const safetyDiagnostics=safety.issues.map(issue=>({stage:'model',category:'type',code:issue.code,msg:issue.evidence,location:issue.location,repairEligible:true,obligationIds:[],ruleIds:[issue.code],modelEvidence:issue.modelEvidence,repair:issue.repair}));
 if(plan.modelRepresentationOption){
  const before=permissionAst(input.candidate,input.context),after=permissionAst(candidate,input.context),option=plan.modelRepresentationOption;
  const resultShapes=(nodes:PermissionAst[])=>nodes.filter(n=>n.clause==='postcondition'&&n.kind==='RuleAtomicExpressionContext'&&n.children[0]?.text==='result').map(astStructureHash);
  const protectedResults=ccHash(resultShapes(before.nodes))===ccHash(resultShapes(after.nodes));
  const nonVacuous=(['precondition','postcondition'] as const).every(c=>sameOclTokens(input.candidate[c],'true')||!sameOclTokens(candidate[c],'true'));
  const preserved=clauses.every(c=>option.clauses.includes(c)||
   (c==='definition'&&option.allowNewDefinition)||sameOclTokens(input.candidate[c],candidate[c]));
  if(after.parsed&&preserved&&protectedResults&&nonVacuous){
   const crossClause=auditCollaborative25({plan:input.plan,context:input.context,candidate,previous:input.candidate},input.pack);
   return {permissionPassed:true,blocked:crossClause.blocked||!!safety.issues.length,permissionSource:'model-grounded-representation-search',
    unauthorized:[],protectedViolations:[],crossClause,ordinary,safety,safetyDiagnostics,
    scope:'Broader diagnosed-clause representation search, with existing Definition and result protection; not a business correctness proof'};
  }
 }
 const aliases=expandTransparentRepairAliases(input.candidate,candidate,input.context);
 if(aliases){
  const option=plan.base.options.find(p=>p.mode==='syntax-clause-fallback'&&
   clauses.every(c=>p.coarseClauses.includes(c)||sameOclTokens(input.candidate[c],aliases.normalized[c])));
  if(option){
   const crossClause=auditCollaborative25({plan:input.plan,context:input.context,candidate,previous:input.candidate},input.pack);
   return {permissionPassed:true,blocked:crossClause.blocked||!!safety.issues.length,permissionSource:'capture-free-direct-state-alias-substitution',
    unauthorized:[],protectedViolations:[],crossClause,ordinary,safety,safetyDiagnostics,aliases,
    scope:'After typed capture-free expansion, all noneditable clauses retain identical tokens. Actual candidate still undergoes full cross-clause and backend validation.'};
  }
 }
 if(!plan.authorizedClauses.length&&!plan.executionEditClauses.length&&!plan.representationEditClauses.length&&!plan.modelRepairRegions.length)return {...ordinary,blocked:ordinary.blocked||!!safety.issues.length,safety,safetyDiagnostics,permissionSource:'existing-v2-options'};
 const editable=[...new Set([...plan.authorizedClauses,...plan.executionEditClauses,...plan.representationEditClauses])];
 const before=permissionAst(input.candidate,input.context),after=permissionAst(candidate,input.context);
 const protectedShape=(node:PermissionAst|undefined,clause:string):unknown=>{
  if(!node)return null;
  if(plan.modelRepairRegions.some(r=>r.clause===clause&&r.path.join('.')===node.path.join('.')))return 'AUTHORIZED_MODEL_SITE';
  return [node.kind,...(node.children.length?node.children.map(n=>protectedShape(n,clause)):[node.text])];
 };
 const modelLocal=(c:string)=>before.parsed&&after.parsed&&plan.modelRepairRegions.some(r=>r.clause===c)&&
  ccHash(protectedShape(before.roots[c as keyof typeof before.roots],c))===ccHash(protectedShape(after.roots[c as keyof typeof after.roots],c));
 const unauthorized=clauses.filter(c=>!(editable as readonly string[]).includes(c)&&!sameOclTokens(input.candidate[c],candidate[c])&&!modelLocal(c)).map(clause=>({clause,path:[],reason:'No independent syntax/execution-order evidence authorizes this clause'}));
 const crossClause=auditCollaborative25({plan:input.plan,context:input.context,candidate,previous:input.candidate},input.pack);
 // Syntax-invalid proposals can be scope-compliant; validity is a distinct acceptance gate.
 const scopePassed=!unauthorized.length;
 return {permissionPassed:ordinary.permissionPassed||scopePassed,
  blocked:(ordinary.permissionPassed?ordinary.blocked:!scopePassed||crossClause.blocked)||!!safety.issues.length,
  permissionSource:ordinary.permissionPassed?'existing-v2-options':'independent-validator-expression-evidence',
  unauthorized,protectedViolations:[],crossClause,ordinary,safety,safetyDiagnostics,
  scope:'Independently diagnosed syntax, execution and model-expression search regions; no claim of behavioral equivalence or semantic root cause'};
}
export function repairControllerV3(base:{role:string;content:string}[],makeInput:(c:RepairCandidate,d:any[],p?:RepairCandidate)=>PermissionInput){
 return {prepare:(candidate:RepairCandidate,diagnostics:any[],previous?:RepairCandidate)=>{
  const plan=planRepairV3(makeInput(candidate,diagnostics,previous));
  const directive=compactRepairJson({version:plan.version,hash:plan.hash,
   ordinaryOptions:repairOptionViewsV2(plan.base),
   independentlyLocatedModelSites:plan.modelRepairRegions,
   modelRepresentationOption:plan.modelRepresentationOption,
   predicateTransitionEvidence:plan.predicateTransitions,
   representationOption:plan.representationEditClauses.length?{coarseClauses:plan.representationEditClauses,evidence:plan.receiverEvidence,preserveClauses:['precondition'],instruction:'Reformulate the model-declared creation target using supported typed bindings. Preserve required effects, object storage and returned identity. This authorizes a representation search, not a semantic correction or backend bypass.'}:null,
   transparentAliasPolicy:{enabled:!candidate.definition.trim(),
    instruction:'For parser fallback only, a fresh Definition alias may refer to exactly one direct self service-state member with its authoritative declared type. All noneditable clauses must expand back to identical original tokens. No query/nested initializer, shadowing, parameter/type-name capture, changed target or new business obligation is permitted. This is a program-checked substitution option, not general permission to edit Definition or Postcondition.'},
   executionOrderOption:plan.executionEditClauses.length?{coarseClauses:plan.executionEditClauses,evidence:plan.safety.issues,preserveClauses:clauses.filter(c=>!plan.executionEditClauses.includes(c))}:null,
   independentSyntaxOption:plan.authorizedClauses.length?{coarseClauses:[...new Set([...plan.authorizedClauses,...plan.executionEditClauses])],evidence:plan.probes.filter(p=>!p.syntaxValid),executionEvidence:plan.safety.issues,
    preserveClauses:clauses.filter(c=>!plan.authorizedClauses.includes(c)&&!plan.executionEditClauses.includes(c)),basis:'Each editable clause has independent parser or execution-hazard evidence; no permission derived from a rejected proposal'}:null},base);
  return {plan,blocked:plan.blocked,messages:[...base,{role:'user',content:JSON.stringify({currentContract:candidate,dependencyRepairDirective:directive,
   instruction:'Return complete D/P/Q in the original protocol. Satisfy ONE ordinary option, modelRepresentationOption, representationOption, independentSyntaxOption or executionOrderOption; alternatively satisfy the strictly checked transparentAliasPolicy on a parser-fallback option. You may instead edit only independentlyLocatedModelSites, whose complete atomic expressions have independently recomputed model diagnostics. The representation/execution/syntax path also authorizes these exact sites; all other AST remains protected. Never combine unrelated ordinary options. Preserve all unrelated structure. Recheck the full contract and execution-order diagnostics. Do not change requirements, UML, signature or tests.'})}]};
 },audit:(candidate:RepairCandidate,value:unknown)=>{const audit=auditRepairV3(value as ReturnType<typeof planRepairV3>,candidate);return {passed:audit.permissionPassed,acceptanceBlocked:audit.blocked,feedbackDiagnostics:[...audit.crossClause.diagnostics,...audit.safetyDiagnostics],details:audit};}};
}
