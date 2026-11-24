const path=require('node:path'),config=require('jest-config'),original=config.readInitialOptions;
config.readInitialOptions=async(...args)=>{const r=await original(...args);return {...r,config:{...r.config,
 cacheDirectory:path.resolve('results/ocl-reference-narrative-v3-v1/cache'),
 modulePathIgnorePatterns:['<rootDir>/results/','<rootDir>/tmp/']}};};
require(path.resolve('scripts/evaluate_ocl_reference.ts'));
