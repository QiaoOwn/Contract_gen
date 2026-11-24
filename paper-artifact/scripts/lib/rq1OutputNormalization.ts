export type FormatChange={path:string;before:unknown;after:unknown;rule:string};
export function normalizeRq1Output(value:unknown,kind:'contract'|'decomposition'|'clause',clause?:string){
 const normalized=structuredClone(value),changes:FormatChange[]=[];
 const body=(v:unknown,key:string,path:string)=>{
  if(typeof v!=='string')return v;
  const after=v.replace(new RegExp(`^\\s*${key}\\s*:\\s*`,'i'),'');
  if(after!==v)changes.push({path,before:v,after,rule:'matching-leading-clause-heading-only'});
  return after;
 };
 if(normalized&&typeof normalized==='object'){
  const root=normalized as any;
  if(kind==='contract'&&root.contract&&typeof root.contract==='object')for(const key of ['definition','precondition','postcondition'])
   if(Object.hasOwn(root.contract,key))root.contract[key]=body(root.contract[key],key,`contract.${key}`);
  if(kind==='clause'&&clause&&Object.hasOwn(root,'expression'))root.expression=body(root.expression,clause,'expression');
  if(kind==='decomposition'&&Array.isArray(root.obligations))root.obligations.forEach((o:any,i:number)=>{
   if(!Array.isArray(o?.sourceSpans))return;
   o.sourceSpans.forEach((span:any,j:number)=>{for(const key of ['start','end']){
    const before=span?.[key];if(typeof before!=='string'||!/^(0|[1-9]\d*)$/.test(before))continue;
    const after=Number(before);if(!Number.isSafeInteger(after))continue;
    span[key]=after;changes.push({path:`obligations.${i}.sourceSpans.${j}.${key}`,before,after,rule:'canonical-nonnegative-integer-string'});
   }});
  });
 }
 return {normalized,changes,version:'rq1-format-only-v1',semanticRepair:false};
}
