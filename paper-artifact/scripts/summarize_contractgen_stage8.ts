import {read,save} from './lib/m4LiveAdapter';
import {tables8} from './lib/contractgenStage8Statistics';
if(!process.argv[2]||!process.argv[3])throw Error('Usage: terminal.json fresh-output.json');
save(process.argv[3],tables8(read(process.argv[2])));
