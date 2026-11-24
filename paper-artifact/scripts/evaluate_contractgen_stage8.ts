import {evaluate8} from './lib/contractgenStage8Evaluation';
if(!process.argv[2])throw Error('Sealed run directory required');
evaluate8(process.argv[2]).then(console.log).catch(e=>{console.error(e);process.exitCode=1;});
