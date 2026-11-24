import {astStructureHash,type PermissionAst} from '../dependencyRepairAst';
import {analyzeRepairCandidate,type RepairCandidate} from '../repairLocalization';
import type {OperationModelGrounding} from '../operationModelGrounding';
import type {RepairDiagnostic} from '../repairDiagnostics';

type Ast=Parameters<typeof astStructureHash>[0];
export type CreationRelocation={bindingId:string;name:string;type:string;declarationPath:number[];
 modelId:string;obligationIds:string[];reason:string};
const contains=(outer:PermissionAst,offset:number)=>!!outer.location&&outer.location.startOffset<=offset&&outer.location.endOffset>offset;
const walk=(root:Ast):PermissionAst[]=>root?[root,...root.children.flatMap(walk)]:[];

export function creationLifetimeRepairScopes(candidate:RepairCandidate,context:OperationModelGrounding,
 before:{nodes:PermissionAst[]},diagnostics:RepairDiagnostic[]){
 const analysis=analyzeRepairCandidate(candidate,context);
 if(!analysis?.modelEvidenceComplete)return [];
 const decisions:CreationRelocation[]=[];
 for(const binding of analysis.evidence.bindings){
  if(binding.declaration?.clause!=='definition'||!binding.uses.length||binding.uses.some(u=>u.clause!=='postcondition'))continue;
  const declaration=before.nodes.find(n=>n.clause==='definition'&&n.kind==='RuleVariableDeclarationCSContext'&&
   n.location?.startOffset===binding.declaration!.startOffset&&n.location?.endOffset===binding.declaration!.endOffset);
  if(!declaration)continue;
  const type=declaration.children.find(n=>n.kind==='RuleTypeCSContext')?.text;
  const entity=context.index.entities.find(e=>e.name===type);if(!entity)continue;
  const initializer=declaration.children.find(n=>n.kind==='RuleOCLExpressionCSContext');
  // Accept only a direct allInstances()->any lookup, not conditionals or nested queries.
  const all=walk(initializer),iterators=all.filter(n=>n.kind==='RuleIteratorExpCSContext');
  if(iterators.length!==1||all.some(n=>['RuleIfExpCSContext','RuleLetExpCSContext'].includes(n.kind)))continue;
  const iterator=iterators[0],classifier=iterator.children.find(n=>n.kind==='RuleClassiferCallExpCSContext');
  if(!classifier?.children.some(n=>n.kind==='RuleSimpleNameCSContext'&&n.text===entity.name)||
   iterator.children.find(n=>n.kind==='RuleIteratorIdentifierContext')?.text!=='any')continue;
  // The query itself must be the whole initializer, not one operand of an expression.
  if(initializer?.text!==iterator.text)continue;
  const newUse=before.nodes.find(n=>n.clause==='postcondition'&&n.kind==='RuleStandardOperationExpCSContext'&&
   n.children.some(c=>c.kind==='RulePredefineOpContext'&&c.text==='oclIsNew()')&&
   n.children.some(c=>c.kind==='RuleVariableExpCSContext'&&c.text===binding.name)&&
   binding.uses.some(u=>contains(n,u.startOffset)));
  if(!newUse)continue;
  const topFormula=before.nodes.find(n=>n.clause==='postcondition'&&n.kind==='RuleLogicFormulaExpCSContext'&&n.path.length===2);
  if(!topFormula||topFormula.children.some(n=>n.kind==='token'&&n.text!=='and')||
   !topFormula.children.some(n=>n.kind==='RuleAtomicExpressionContext'&&n.text===newUse.text&&contains(n,newUse.location!.startOffset)))continue;
  const relevant=diagnostics.filter(d=>d.stage==='development'&&d.repairEligible&&d.requirementEvidence?.length&&
   d.modelEvidence.some(m=>m.id===entity.id||entity.features.some(f=>f.id===m.id))&&
   d.requirementEvidence.some(e=>d.obligationIds.includes(e.id))&&
   d.candidateScopes?.some(s=>s.clause==='postcondition'));
  if(!relevant.length)continue;
  decisions.push({bindingId:binding.id,name:binding.name,type:entity.name,declarationPath:declaration.path,
   modelId:entity.id,obligationIds:[...new Set(relevant.flatMap(d=>d.obligationIds))],
   reason:'Resolved Definition lookup binding is used only in Q, including oclIsNew. A source-linked public failure permits relocating exactly this binding to an uninitialized outer Q let and moving only its existing positive oclIsNew atomic to the first Q conjunct. P, other D declarations, every Q atomic expression and the relative order of other Q atoms remain structurally identical.'});
 }
 return decisions;
}

export function auditCreationRelocation(before:{roots:Partial<Record<string,PermissionAst>>},
 after:{roots:Partial<Record<string,PermissionAst>>},options:CreationRelocation[]){
 for(const option of options){
  if(astStructureHash(before.roots.precondition)!==astStructureHash(after.roots.precondition))continue;
  const oldDeclarations=before.roots.definition?.children.filter(n=>n.kind==='RuleVariableDeclarationCSContext')??[];
  const nextDeclarations=after.roots.definition?.children.filter(n=>n.kind==='RuleVariableDeclarationCSContext')??[];
  const retained=oldDeclarations.filter(n=>n.children[0]?.text!==option.name);
  if(retained.length!==oldDeclarations.length-1||retained.length!==nextDeclarations.length||
   retained.some((n,i)=>astStructureHash(n)!==astStructureHash(nextDeclarations[i])))continue;
  const root=after.roots.postcondition?.children.find(n=>n.kind==='RuleOCLExpressionCSContext');
  const local=root?.children.length===1?root.children[0]:undefined;
  if(local?.kind!=='RuleLetExpCSContext')continue;
  const declarations=local.children.filter(n=>n.kind==='RuleVariableDeclarationCSContext');
  if(declarations.length!==1)continue;
  const declaration=declarations[0];
  if(declaration.children.length!==3||declaration.children[0]?.text!==option.name||declaration.children[1]?.text!==':'||
   declaration.children[2]?.kind!=='RuleTypeCSContext'||declaration.children[2]?.text!==option.type)continue;
  const body=local.children.find(n=>n.kind==='RuleOCLExpressionCSContext');
  const original=before.roots.postcondition?.children.find(n=>n.kind==='RuleOCLExpressionCSContext');
  if(astStructureHash(body)!==astStructureHash(original)){
   const formula=(node:Ast)=>node?.children.length===1&&node.children[0].kind==='RuleLogicFormulaExpCSContext'?node.children[0]:undefined;
   const oldFormula=formula(original),newFormula=formula(body);
   if(!oldFormula||!newFormula||[oldFormula,newFormula].some(n=>n.children.some(c=>c.kind==='token'&&c.text!=='and')))continue;
   const oldAtoms=oldFormula.children.filter(n=>n.kind==='RuleAtomicExpressionContext');
   const newAtoms=newFormula.children.filter(n=>n.kind==='RuleAtomicExpressionContext');
   const creation=oldAtoms.filter(n=>n.text===`${option.name}.oclIsNew()`);
   if(creation.length!==1||newAtoms.length!==oldAtoms.length||astStructureHash(newAtoms[0])!==astStructureHash(creation[0]))continue;
   const retained=oldAtoms.filter(n=>n!==creation[0]);
   if(retained.some((n,i)=>astStructureHash(n)!==astStructureHash(newAtoms[i+1])))continue;
  }
  // Do not capture an existing local of the same spelling under the new outer scope.
  if(walk(original).some(n=>n.kind==='RuleVariableDeclarationCSContext'&&n.children[0]?.text===option.name))continue;
  return {passed:true,option,basis:'exact-binding-relocation-and-optional-creation-first-with-protected-P-other-D-and-Q-atoms'};
 }
 return {passed:false,basis:'No exact pre-authorized lifecycle relocation matched'};
}
