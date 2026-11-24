import {getRemodelAntlr} from '../../remodel/parser';

export function oclTokenIdentity(source:string|null|undefined):string|null {
 const {lexer}=getRemodelAntlr(source??'');let errors=0;
 lexer.removeErrorListeners();lexer.addErrorListener({syntaxError:()=>{errors++;}} as any);
 const tokens=lexer.getAllTokens();
 return errors?null:JSON.stringify(tokens.filter(t=>t.channel===0).map(t=>[t.type,t.text]));
}
export function sameOclTokens(before:string|null|undefined,after:string|null|undefined){
 if(before===after)return true;
 const left=oclTokenIdentity(before),right=oclTokenIdentity(after);
 return left!==null&&right!==null&&left===right;
}
