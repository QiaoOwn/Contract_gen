const path=require('node:path'),config=require('jest-config'),original=config.readInitialOptions;
const out=process.argv[3];if(!out)throw Error('Sealed source and fresh output required');
config.readInitialOptions=async(...args)=>{const r=await original(...args);return {...r,config:{...r.config,cacheDirectory:path.resolve(out,'cache'),coverageDirectory:path.resolve(out,'coverage'),modulePathIgnorePatterns:['<rootDir>/results/','<rootDir>/tmp/']}};};
require(path.resolve('scripts/evaluate_rq1_six_smoke.ts'));
