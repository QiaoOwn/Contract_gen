const path=require('node:path'),fs=require('node:fs');
const args=process.argv,get=k=>args.includes(k)?args[args.indexOf(k)+1]:null;
const output=get('--output');if(!output)throw Error('Explicit capture output required');
const folder=path.dirname(path.resolve(output));
const root=path.resolve('results/rq2-validation-narrative-v1')+path.sep;
if(!folder.startsWith(root))throw Error('Capture output outside isolated validation root');
globalThis.fetch=async()=>{throw Error('Offline capture forbids model/network calls');};
const config=require('jest-config'),original=config.readInitialOptions;
config.readInitialOptions=async(...values)=>{const result=await original(...values);return {...result,config:{...result.config,
 collectCoverage:false,coverageDirectory:path.join(folder,'coverage'),cacheDirectory:path.join(folder,'cache'),
 modulePathIgnorePatterns:['<rootDir>/results/','<rootDir>/tmp/']}};};
fs.mkdirSync(folder,{recursive:true});
require(path.resolve('scripts/capture-semantic-operation.ts'));
