const path=require('node:path'),config=require('jest-config'),old=config.readInitialOptions;
const out=process.argv[2];if(!out)throw Error('Fresh output required');
config.readInitialOptions=async(...args)=>{const r=await old(...args);return {...r,config:{...r.config,cacheDirectory:path.resolve(out,'cache'),coverageDirectory:path.resolve(out,'coverage'),modulePathIgnorePatterns:['<rootDir>/results/','<rootDir>/tmp/']}};};
process.argv.push('--terminal');require(path.resolve('scripts/test_contractgen_stage8_faults.ts'));
