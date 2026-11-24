import fs from 'node:fs';
import {parse} from 'dotenv';
import {prepareSix,verifySix,executeSix,httpTransport6} from './lib/rq1SixMethodExecution';
import {rq1Methods} from './lib/rq1NarrativeComparisons';
async function main(){
 const args=process.argv.slice(2),allowed=new Set(['--output','--operation','--preview','--authorization','--execute-paid','--methods']);
 for(let n=0;n<args.length;n++){if(!allowed.has(args[n]))throw Error('Unknown argument');if(args[n]!=='--execute-paid'){if(!args[n+1]||args[n+1].startsWith('--'))throw Error('Missing value');n++;}}
 const get=(key:string)=>args.includes(key)?args[args.indexOf(key)+1]:'';
 if(!get('--output'))throw Error('--output required');
 if(!args.includes('--execute-paid')){if(get('--authorization'))throw Error('Authorization cannot execute by itself');console.log(prepareSix(get('--output'),get('--operation')||'CoCoME_manageStore_queryStore',get('--methods')?get('--methods').split(',') as typeof rq1Methods[number][]:rq1Methods));return;}
 if(get('--methods')||get('--operation'))throw Error('Paid execution uses frozen preview selection only');
 if(!get('--preview'))throw Error('Frozen preview required');
 if(get('--authorization'))throw Error('Authorization files are no longer used; omit --authorization');
 const env={...(fs.existsSync('.env')?parse(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?parse(fs.readFileSync('.env.local')):{}),...process.env};
 const endpoint=env.OPENAI_BASE_URL,key=env.OPENAI_API_KEY||env.API_KEY;if(!endpoint||!key)throw Error('Missing endpoint/key; no probe sent');
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Invalid HTTPS endpoint');
 const i=verifySix(get('--preview'));
 console.log(await executeSix(get('--preview'),get('--output'),httpTransport6(endpoint,key,i.config.sampling,i.timeoutMs??120000),false,{executePaid:true}));
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
