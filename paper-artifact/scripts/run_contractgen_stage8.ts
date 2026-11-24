import fs from 'node:fs';
import {parse as parseEnv} from 'dotenv';
import {preview8,authorize8,execute8,httpTransport6,units8} from './lib/contractgenStage8';
import {read} from './lib/m4LiveAdapter';
async function main(){
 const args=process.argv.slice(2),allowed=new Set(['--preview','--output','--authorization','--execute-paid','--inspect']);
 for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw Error(`Unknown option ${args[i]}`);if(args[i]!=='--execute-paid'){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing argument');i++;}}
 const value=(key:string)=>args.includes(key)?args[args.indexOf(key)+1]:'';
 if(value('--inspect')){if(args.includes('--execute-paid')||value('--authorization'))throw Error('Inspection never executes');console.log(JSON.stringify({units:units8(value('--inspect')),retryAllowed:false}));return;}
 const output=value('--output');if(!output)throw Error('Fresh --output required');
 if(!args.includes('--execute-paid')){if(value('--authorization'))throw Error('Authorization needs explicit execution switch');console.log(await preview8(output));return;}
 const preview=value('--preview'),authFile=value('--authorization');if(!preview||!authFile)throw Error('Explicit preview and new authorization required');
 const env={...(fs.existsSync('.env')?parseEnv(fs.readFileSync('.env')):{}),...(fs.existsSync('.env.local')?parseEnv(fs.readFileSync('.env.local')):{}),...process.env};
 const endpoint=env.OPENAI_BASE_URL,key=env.OPENAI_API_KEY||env.API_KEY;
 if(!endpoint||!key)throw Error('Missing endpoint/key; no probe sent');
 const authorization=read(authFile),identity=authorize8(preview,output,authorization,endpoint);
 const transport=httpTransport6(endpoint,key,identity.config.sampling);
 console.log(await execute8(preview,output,transport,false,{authorization,endpoint}));
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
