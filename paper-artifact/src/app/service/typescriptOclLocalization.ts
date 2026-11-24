import * as babel from '@babel/core';
import * as t from '@babel/types';
import {permissionAst,pathContains} from './dependencyRepairAst';
import type {RepairCandidate} from './repairLocalization';
import type {OperationModelGrounding} from './operationModelGrounding';
import type {RepairDiagnostic} from './repairDiagnostics';
import {ccHash} from './crossClauseGraph';

/** Uses existing generated expression metadata; no name-based or business-semantic inference. */
export function localizeTypescriptDiagnostics(entry:string,candidate:RepairCandidate,context:OperationModelGrounding,diagnostics:RepairDiagnostic[]){
 const ocl=permissionAst(candidate,context);
 const generated=babel.parseSync(entry,{sourceType:'module',parserOpts:{plugins:['typescript']}});
 if(!generated)throw Error('Generated TypeScript AST unavailable');
 const lines=entry.split('\n'),starts:number[]=[];let offset=0;
 for(const line of lines){starts.push(offset);offset+=line.length+1;}
 const traces:any[]=[];
 const mapped=diagnostics.map(d=>{
  if(d.stage!=='typescript'||d.location.resolution!=='generated-typescript')return d;
  const {line,column}=d.location;
  const fail=(reason:string)=>{traces.push({status:'unresolved',code:d.code,generatedLocation:d.location,reason});return d;};
  if(!ocl.parsed)return fail('Candidate OCL is not parseable');
  if(!line||!column||line>lines.length||column>lines[line-1].length+1)return fail('Invalid generated coordinates');
  const position=starts[line-1]+column-1;
  const hits:{description:string;clause:'precondition'|'postcondition';start:number;end:number;branches:{condition:string;branch:'then'|'else'}[]}[]=[];
  babel.traverse(generated,{ObjectExpression(p){
   if(p.node.start==null||p.node.end==null||position<p.node.start||position>=p.node.end)return;
   const description=p.node.properties.find(v=>t.isObjectProperty(v)&&t.isIdentifier(v.key,{name:'description'})&&t.isStringLiteral(v.value));
   const executable=p.node.properties.find(v=>t.isObjectProperty(v)&&t.isIdentifier(v.key)&&['logic','execute'].includes(v.key.name)&&v.value.start!=null&&v.value.end!=null&&position>=v.value.start&&position<v.value.end);
   if(!description||!executable||!t.isObjectProperty(description)||!t.isStringLiteral(description.value))return;
   const call=p.parentPath;if(!call.isCallExpression())return;
   const callee=call.node.callee;
   if(!(t.isIdentifier(callee,{name:'l'})||(t.isMemberExpression(callee)&&!callee.computed&&t.isIdentifier(callee.property,{name:'and'}))))return;
   let clause:'precondition'|'postcondition'|null=null;
   for(let parent=p.parentPath;parent;parent=parent.parentPath!){
    if(!parent.isVariableDeclarator())continue;
    const id=parent.node.id;
    if(t.isObjectPattern(id)){
     if(id.properties.some(v=>t.isObjectProperty(v)&&t.isIdentifier(v.value,{name:'isPreconditionPass'}))){clause='precondition';break;}
     if(id.properties.some(v=>t.isObjectProperty(v)&&t.isIdentifier(v.value,{name:'isPostconditionPass'}))){clause='postcondition';break;}
    }
    if(t.isIdentifier(id,{name:'result'})){clause='postcondition';break;}
   }
   const branches:{condition:string;branch:'then'|'else'}[]=[];
   for(let parent=p.parentPath;parent;parent=parent.parentPath!){
    if(!parent.isObjectExpression())continue;
    const condition=parent.node.properties.find(v=>t.isObjectProperty(v)&&t.isIdentifier(v.key,{name:'description'})&&t.isStringLiteral(v.value));
    const branch=parent.node.properties.find(v=>t.isObjectProperty(v)&&t.isIdentifier(v.key)&&['then','else'].includes(v.key.name)&&v.value.start!=null&&v.value.end!=null&&position>=v.value.start&&position<v.value.end);
    if(condition&&branch&&t.isObjectProperty(condition)&&t.isStringLiteral(condition.value)&&t.isObjectProperty(branch)&&t.isIdentifier(branch.key))
     branches.push({condition:condition.value.value,branch:branch.key.name as 'then'|'else'});
   }
   if(clause)hits.push({description:description.value.value,clause,start:p.node.start,end:p.node.end,branches});
  }});
  hits.sort((a,b)=>(a.end-a.start)-(b.end-b.start));const selected=hits[0];
  if(!selected)return fail('No containing generated logic/effect expression with trace metadata');
  const matches=ocl.nodes.filter(n=>n.clause===selected.clause&&n.location&&n.text===selected.description&&['RuleAtomicExpressionContext','RuleVariableDeclarationCSContext'].includes(n.kind));
  // Repeated expressions are distinguishable only when generated branch metadata
  // agrees with the actual enclosing OCL if/then/else structure.
  const located=matches.filter(n=>selected.branches.every(b=>ocl.nodes.some(parent=>
   parent.clause===n.clause&&parent.kind==='RuleIfExpCSContext'&&parent.children[1]?.text===b.condition&&
   !!parent.children[b.branch==='then'?3:5]&&pathContains(parent.children[b.branch==='then'?3:5].path,n.path))));
  const unique=[...new Map(located.map(n=>[`${n.location!.startOffset}:${n.location!.endOffset}`,n])).values()];
  if(unique.length!==1)return fail(`Expected one exact source expression, found ${unique.length}`);
  const node=unique[0],location=node.location!;
  const trace={version:'typescript-ocl-expression-trace-v1',status:'mapped',entryHash:ccHash(entry),candidateHash:ccHash(candidate),generatedLocation:d.location,
   generatedRange:{start:selected.start,end:selected.end},oclRange:location,oclAstPath:node.path,sourceExpression:node.text,branchEvidence:selected.branches,basis:'Containing generated logic/effect object plus unique exact expression metadata and enclosing branch path within the same clause',rootCauseEstablished:false};
  traces.push(trace);
  return {...d,location:{resolution:'ocl-expression' as const,clause:node.clause,line:location.line,column:location.column-1},generatedOrigin:d.location,sourceTrace:trace};
 });
 return {diagnostics:mapped,traces,mapped:traces.filter(t=>t.status==='mapped').length,unresolved:traces.filter(t=>t.status==='unresolved').length};
}
