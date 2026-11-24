import {permissionAst} from './dependencyRepairAst';
import {parse} from '../util';
import {getRemodelAntlr} from '../../remodel/parser';
import type {RepairCandidate} from './repairLocalization';
import type {OperationModelGrounding} from './operationModelGrounding';

/** Deliberately narrow: fresh D aliases of direct service-state reads only. */
export function expandTransparentRepairAliases(before:RepairCandidate,after:RepairCandidate,context:OperationModelGrounding){
 if(before.definition?.trim()||!after.definition?.trim())return null;
 const ast=permissionAst(after,context);if(!ast.parsed)return null;
 const tree=parse(ast.contract).tree!,declarations=tree.ruleDefinition()?.ruleVariableDeclarationCS_list()??[];
 if(!declarations.length)return null;
 const forbidden=new Set([...context.index.operation.parameters.map(p=>p.name),...context.index.environment.map(e=>e.name),...context.index.entities.map(e=>e.name),'self','result']);
 const aliases=new Map<string,string>();
 for(const d of declarations){
  const name=d.ruleSimpleNameCS().getText(),initializer=d.ruleOCLExpressionCS()?.getText(),type=d.ruleTypeCS()?.getText();
  const source=context.index.operation.serviceState.find(s=>initializer===`self.${s.name}`&&type===s.type.raw);
  if(!source||forbidden.has(name)||aliases.has(name))return null;
  aliases.set(name,initializer!);
 }
 let shadowed=false;
 const walk=(n:any)=>{if(!n)return;if(n.constructor.name==='RuleVariableDeclarationCSContext'&&!declarations.includes(n)&&aliases.has(n.ruleSimpleNameCS().getText()))shadowed=true;for(const c of n.children??[])walk(c);};walk(tree);
 if(shadowed)return null;
 const expand=(body:string)=>{
  const {lexer}=getRemodelAntlr(body);
  const tokens=lexer.getAllTokens().filter((t:any)=>t.channel===0&&t.type!==-1);let result=body;
  for(let i=tokens.length-1;i>=0;i--){const token=tokens[i];const value=aliases.get(token.text);if(!value||['.','::'].includes(tokens[i-1]?.text))continue;result=result.slice(0,token.start)+value+result.slice(token.stop+1);}
  return result;
 };
 return {normalized:{definition:'',precondition:expand(after.precondition),postcondition:expand(after.postcondition)},
  aliases:[...aliases].map(([name,initializer])=>({name,initializer,basis:'Authoritative service-state type and pure direct-root alias; no query, nested navigation, effect or local capture'})),
  scope:'Capture-free source-root substitution, not business equivalence of arbitrary expressions'};
}
