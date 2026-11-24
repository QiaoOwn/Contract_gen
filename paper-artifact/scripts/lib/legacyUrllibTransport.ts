import {spawn} from 'node:child_process';
import type {Transport6} from './contractgenStage6';

export function legacyUrllibTransport(endpoint:string,key:string,sampling:{model:string;temperature:number;maxOutputTokens:number},proxy:string|null,python='python',timeoutMs=600000):Transport6{
 return async messages=>{
  const request={url:endpoint.replace(/\/$/,'')+'/chat/completions',key,proxy,timeoutSeconds:timeoutMs/1000,
   payload:{model:sampling.model,temperature:sampling.temperature,max_tokens:sampling.maxOutputTokens,messages,response_format:{type:'json_object'}}};
  const response:any=await new Promise((resolve,reject)=>{
   const child=spawn(python,['scripts/lib/urllib_model_transport.py'],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONIOENCODING:'utf-8'}});
   let stdout='',stderr='',finished=false;
   const timer=setTimeout(()=>{child.kill();finish(new Error('urllib transport timeout; request state unknown'));},timeoutMs+10000);
   const finish=(error?:Error,value?:unknown)=>{if(finished)return;finished=true;clearTimeout(timer);if(error)reject(error);else resolve(value);};
   child.on('error',e=>finish(e));child.stdin.on('error',e=>finish(e));
   child.stdout.on('data',b=>{stdout+=b.toString('utf8');});child.stderr.on('data',b=>{stderr+=b.toString('utf8');});
   child.on('close',code=>{try{const parsed=JSON.parse(stdout);if(parsed.transportError)finish(new Error(`urllib network error: ${parsed.transportError}`));else if(code!==0)finish(new Error(`urllib process exited ${code}`));else finish(undefined,parsed);}catch{finish(new Error(`urllib invalid transport response (exit ${code}); ${stderr.slice(0,200)}`));}});
   child.stdin.end(JSON.stringify(request));
  });
  let body:any;try{body=JSON.parse(response.rawText);}catch{return {content:'',raw:response,model:sampling.model,inputTokens:null,outputTokens:null,reasoningTokens:null,finishReason:'provider-malformed'};}
  return {content:response.status>=200&&response.status<300?body.choices?.[0]?.message?.content??'':'',raw:{status:response.status,body},model:body.model??sampling.model,id:body.id,
   inputTokens:body.usage?.prompt_tokens??null,outputTokens:body.usage?.completion_tokens??null,reasoningTokens:body.usage?.completion_tokens_details?.reasoning_tokens??null,finishReason:body.choices?.[0]?.finish_reason??null};
 };
}
