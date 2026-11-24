import {generateContractCode,parse} from '../util';
import type {PermissionInput} from './dependencyRepairPermissions';
import type {RepairCandidate} from './repairLocalization';
import type {ParserRuleContext} from 'antlr4';

export function auditRepairExecutionSafety(candidate:RepairCandidate,context:PermissionInput['context']){
 const op=context.index.operation;
 const text=generateContractCode({serviceName:op.service,operationName:op.name,parameters:op.parameters.map(p=>({name:p.name,type:p.type.raw})),returnedType:op.returnType?.type.raw,...candidate});
 const parsed=parse(text);const issues:any[]=[];
 if(!parsed.tree||parsed.errors.length)return {parsed:false,issues,scope:'No execution findings for unparsed input'};
 const walk=(node:any,fn:(node:any)=>void)=>{if(!node)return;fn(node);for(const child of node.children??[])walk(child,fn);};
 const atomTexts=(node:any)=>{const texts=new Set<string>();walk(node,n=>{if(n.constructor.name==='RuleAtomicExpressionContext')texts.add(n.getText());});return texts;};
 const tests=(node:any,root:string,present:boolean)=>{
  const atoms=atomTexts(node);return atoms.has(`${root}.oclIsUndefined()=${present?'false':'true'}`)||atoms.has(`${root}${present?'<>':'='}null`);
 };
 const guarded=(node:ParserRuleContext,root:string)=>{
  let child:any=node,parent:any=node.parentCtx;
  while(parent){
   if(parent.constructor.name==='RuleIfExpCSContext'){
    const cond=parent.ruleOCLExpressionCS(0),then=parent.ruleOCLExpressionCS(1),otherwise=parent.ruleOCLExpressionCS(2);
    const condition=cond.getText();
    if((child===then&&[`${root}.oclIsUndefined()=false`,`${root}<>null`].includes(condition))||
       (child===otherwise&&[`${root}.oclIsUndefined()=true`,`${root}=null`].includes(condition)))return true;
   }
   child=parent;parent=parent.parentCtx;
  }return false;
 };
 walk(parsed.tree.rulePrecondition(),node=>{
  if(node.constructor.name!=='RuleLetExpCSContext')return;
  const body=node.ruleOCLExpressionCS();
  const aliases=new Map<string,string>();
  // Resolve only preceding direct aliases: never infer identity from similar names.
  const canonical=(path:string)=>{
   const head=/^[A-Za-z_][A-Za-z_0-9]*/.exec(path)?.[0];
   return head&&aliases.has(head)?aliases.get(head)!+path.slice(head.length):path;
  };
  // Lexically enclosing let bindings are available in the nested let body.
  // Resolve direct aliases only, from outermost scope to innermost scope.
  const enclosing:any[]=[];
  for(let p=node.parentCtx;p;p=p.parentCtx)if(p.constructor.name==='RuleLetExpCSContext')enclosing.unshift(p);
  for(const scope of enclosing)for(const declaration of scope.ruleVariableDeclarationCS_list()){
   const initializer=declaration.ruleOCLExpressionCS(),name=declaration.ruleSimpleNameCS().getText();
   const value=initializer?.getText();
   if(value&&/^[A-Za-z_][A-Za-z_0-9]*(\.[A-Za-z_][A-Za-z_0-9]*)*$/.test(value))aliases.set(name,canonical(value));
   else aliases.delete(name);
  }
  for(const declaration of node.ruleVariableDeclarationCS_list()){
   const initializer=declaration.ruleOCLExpressionCS();if(!initializer)continue;
   const dependencies:{path:string;node:ParserRuleContext}[]=[];walk(initializer,n=>{if(n.constructor.name==='RulePropertyCallExpCSContext')dependencies.push({path:canonical(n.getText()),node:n});});
   for(const state of op.serviceState){
    const root=`self.${state.name}`;
    const rootAliases=[...aliases].filter(([,value])=>value===root).map(([name])=>name);
    const unsafe=dependencies.some(p=>p.path.startsWith(root+'.')&&!guarded(p.node,root)&&!rootAliases.some(name=>guarded(p.node,name)));
    if(!unsafe)continue;
    const checked=tests(body,root,true)||rootAliases.some(name=>tests(body,name,true));
    if(!checked||guarded(node,root)||guarded(declaration,root))continue;
    issues.push({code:'EXEC-EAGER-GUARD-ORDER',status:'witnessed-structural-hazard',clause:'precondition',
     expression:initializer.getText(),binding:declaration.ruleSimpleNameCS().getText(),root,
     location:{resolution:'ocl-expression',clause:'precondition',line:declaration.start.line,column:declaration.start.column,startOffset:declaration.start.start,endOffset:declaration.stop.stop+1},
     modelEvidence:[{id:state.id,name:state.name}],
     evidence:'This let initializer dereferences a service-state object before evaluating the same-root existence test in the let body. For an undefined root the guard cannot run first.',
     repair:'Preserve the original existence condition and effects. Evaluate the root guard before this dependent initializer, for example in a guarded branch. Do not add new business requirements.'});
   }
   const value=initializer.getText();
   if(/^[A-Za-z_][A-Za-z_0-9]*(\.[A-Za-z_][A-Za-z_0-9]*)*$/.test(value))aliases.set(declaration.ruleSimpleNameCS().getText(),canonical(value));
   else aliases.delete(declaration.ruleSimpleNameCS().getText());
  }
 });
 walk(parsed.tree.rulePostcondition(),node=>{
  if(node.constructor.name!=='RuleLetExpCSContext')return;
  let parent=node.parentCtx;
  while(parent&&parent.constructor.name==='RuleOCLExpressionCSContext')parent=parent.parentCtx;
  if(parent?.constructor.name!=='RulePostconditionContext')return;
  for(const declaration of node.ruleVariableDeclarationCS_list()){
   const initializer=declaration.ruleOCLExpressionCS();if(!initializer)continue;
   let readsResult=false;walk(initializer,n=>{if(n.constructor.name==='RuleVariableExpCSContext'&&n.getText()==='result')readsResult=true;});
   if(!readsResult)continue;
   issues.push({code:'EXEC-RETURN-INITIALIZER',status:'witnessed-structural-hazard',clause:'postcondition',root:'result',binding:declaration.ruleSimpleNameCS().getText(),expression:initializer.getText(),
    location:{resolution:'ocl-expression',clause:'postcondition',line:declaration.start.line,column:declaration.start.column,startOffset:declaration.start.start,endOffset:declaration.stop.stop+1},modelEvidence:[],
    evidence:'An outermost executable postcondition let reads the operation return value in its initializer before the postcondition body produces that value.',
    repair:'Preserve the required return identity and effects. Bind the source object or declare the new local object independently, then assign result in the body; do not use the not-yet-produced return value as a let initializer.'});
  }
 });
 return {parsed:true,issues,scope:'Narrow AST execution-order hazards; not general null-safety, all-path analysis or business semantic proof'};
}
