import {astStructureHash,pathContains,type PermissionAst} from '../dependencyRepairAst';

/** Permit arity changes only inside fully authorized runs of an AND formula. */
export function auditAuthorizedConjunctEdits(before:PermissionAst,after:PermissionAst,
 regions:{clause:string;path:number[]}[]){
 if(before.kind!=='RuleLogicFormulaExpCSContext'||after.kind!==before.kind)return false;
 const conjuncts=(node:PermissionAst)=>{
  if(node.children.some((c,i)=>i%2===1?(c.kind!=='token'||c.text!=='and'):c.kind==='token'))return null;
  return node.children.filter((_,i)=>i%2===0);
 };
 const old=conjuncts(before),next=conjuncts(after);if(!old?.length||!next?.length)return false;
 const authorized=old.map(n=>regions.some(r=>r.clause===n.clause&&pathContains(r.path,n.path)));
 if(!authorized.some(Boolean))return false;
 // Partially editable atoms retain their internal structure under the normal audit.
 if(old.some((n,i)=>!authorized[i]&&regions.some(r=>r.clause===n.clause&&pathContains(n.path,r.path))))return false;
 let oldIndex=0,nextIndex=0;
 while(oldIndex<old.length){
  if(authorized[oldIndex]){
   while(oldIndex<old.length&&authorized[oldIndex])oldIndex++;
   if(oldIndex===old.length)return true;
   const anchor=astStructureHash(old[oldIndex]);
   const matches=next.map((n,i)=>i>=nextIndex&&astStructureHash(n)===anchor?i:-1).filter(i=>i>=0);
   if(matches.length!==1)return false;
   nextIndex=matches[0];
  }
  if(nextIndex>=next.length||astStructureHash(old[oldIndex])!==astStructureHash(next[nextIndex]))return false;
  oldIndex++;nextIndex++;
 }
 return nextIndex===next.length;
}
