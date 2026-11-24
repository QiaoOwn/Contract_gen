import {preview8} from './lib/contractgenStage8';
preview8(process.argv[2]??'results/contractgen-stage8-preview-v1').then(console.log).catch(e=>{console.error(e);process.exitCode=1;});
