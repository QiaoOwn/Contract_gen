import {execFileSync} from 'node:child_process';
import net from 'node:net';
import {Agent,EnvHttpProxyAgent,setGlobalDispatcher} from 'undici';
type Env=Record<string,string|undefined>;
export function selectExperimentProxy(env:Env,windowsProxy?:string){
 if(env.CONTRACTGEN_PROXY==='direct')return {source:'explicit-direct',proxy:undefined};
 const raw=env.CONTRACTGEN_PROXY||env.HTTPS_PROXY||env.https_proxy||env.HTTP_PROXY||env.http_proxy||env.ALL_PROXY||env.all_proxy||windowsProxy;
 if(!raw)return {source:'direct-no-proxy-configured',proxy:undefined};
 const address=raw.includes('=')&&!raw.includes('://')?Object.fromEntries(raw.split(';').map(p=>p.split('='))):null;
 const value=address?(address.https||address.http):raw;if(!value)throw Error('Unsupported proxy format; set CONTRACTGEN_PROXY explicitly');
 const url=new URL(value.includes('://')?value:`http://${value}`);
 if(!['http:','https:'].includes(url.protocol))throw Error('Only HTTP/HTTPS proxy is supported, not SOCKS');
 return {source:env.CONTRACTGEN_PROXY?'CONTRACTGEN_PROXY':raw===windowsProxy?'windows-system-proxy':'proxy-environment',proxy:url.href};
}
export async function checkProxyPort(proxy:string){
 const url=new URL(proxy);await new Promise<void>((resolve,reject)=>{
  const socket=net.createConnection({host:url.hostname,port:Number(url.port||(url.protocol==='https:'?443:80))});
  const fail=(e:Error)=>{socket.destroy();reject(new Error(`Proxy unavailable at ${url.hostname}:${url.port||'default'}: ${e.message}`));};
  socket.setTimeout(3000,()=>fail(new Error('connection timeout')));socket.once('error',fail);socket.once('connect',()=>{socket.destroy();resolve();});
 });
}
export async function configureExperimentProxy(env:Env){
 let windows:string|undefined;
 if(process.platform==='win32'&&!['CONTRACTGEN_PROXY','HTTPS_PROXY','https_proxy','HTTP_PROXY','http_proxy','ALL_PROXY','all_proxy'].some(k=>env[k])){
  const text=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' | Select-Object ProxyEnable,ProxyServer,AutoConfigURL | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true,timeout:5000});
  const settings=JSON.parse(text);if(settings.ProxyEnable===1)windows=settings.ProxyServer;
  else if(settings.AutoConfigURL)throw Error('PAC requires explicit CONTRACTGEN_PROXY or direct');
 }
 const selection=selectExperimentProxy(env,windows);
 if(selection.proxy){await checkProxyPort(selection.proxy);setGlobalDispatcher(new EnvHttpProxyAgent({httpProxy:selection.proxy,httpsProxy:selection.proxy,noProxy:env.NO_PROXY??env.no_proxy??''}));}
 else setGlobalDispatcher(new Agent());
 const url=selection.proxy?new URL(selection.proxy):null;
 return {source:selection.source,proxy:url?`${url.protocol}//${url.hostname}:${url.port||'default'}`:null,noProxyConfigured:!!(env.NO_PROXY||env.no_proxy),modelRequests:0,automaticRetries:0};
}
