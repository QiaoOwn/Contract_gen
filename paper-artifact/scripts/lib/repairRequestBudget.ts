import type {Message3} from '../rq3OrdinaryRepair';
/** Remove JSON formatting only; never remove fields, evidence, or natural-language text. */
export function compactJsonMessages(messages:Message3[]):Message3[]{
 return messages.map(message=>{
  try{
   const value=JSON.parse(message.content);
   if(!value||typeof value!=='object')return {...message};
   const content=JSON.stringify(value);
   if(JSON.stringify(JSON.parse(content))!==JSON.stringify(value))throw Error('Request compaction mismatch');
   return {...message,content};
  }catch{return {...message};}
 });
}
export class RepairInputBudgetError extends Error {readonly code='REPAIR_INPUT_BUDGET';}
export function isRepairInputBudgetError(e:unknown){return !!e&&typeof e==='object'&&(e as any).code==='REPAIR_INPUT_BUDGET';}
export function expandFeedback(payload:{dictionary:string[];body:any}):any{
 const walk=(v:any):any=>{
  if(Array.isArray(v))return v.map(walk);
  if(v&&typeof v==='object'){
   if(Object.keys(v).length===1&&Number.isInteger(v.$text)){if(typeof payload.dictionary[v.$text]!=='string')throw Error('Invalid text reference');return payload.dictionary[v.$text];}
   return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x)]));
  }return v;
 };return walk(payload.body);
}
export function compactRejectionFeedback(messages:Message3[]):Message3[]{
 const last=messages.at(-1);if(!last)return messages;
 let body:any;try{body=JSON.parse(last.content);}catch{return messages;}
 if(body.version!=='permission-rejection-feedback-v1')return messages;
 const base=messages.slice(0,-1),counts=new Map<string,number>();
 const count=(v:any)=>{if(typeof v==='string'&&v.length>=24)counts.set(v,(counts.get(v)??0)+1);else if(v&&typeof v==='object')Object.values(v).forEach(count);};count(body);
 const dictionary:string[]=[],ids=new Map<string,number>();
 const encode=(v:any):any=>{
  if(typeof v==='string'&&(counts.get(v)??0)>1){let id=ids.get(v);if(id===undefined){id=dictionary.length;ids.set(v,id);dictionary.push(v);}return {$text:id};}
  if(Array.isArray(v))return v.map(encode);
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]));return v;
 };
 const packed={dictionary,body:encode(body),interpretation:'Replace each singleton {"$text":N} with dictionary[N]. Expansion preserves the exact previous feedback. These references do not grant additional edit permissions.'};
 const content=JSON.stringify({version:'permission-rejection-packed-v1',payload:packed});
 if(Buffer.byteLength(content)>=Buffer.byteLength(last.content))return messages;
 if(JSON.stringify(expandFeedback(packed))!==JSON.stringify(body))throw Error('Feedback compression mismatch');
 return [...base,{role:last.role,content}];
}
