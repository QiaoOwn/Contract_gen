import {createHash} from 'node:crypto';
import {createGenerationGrammar} from './createG4Prompt';

export function getOcltsvmLanguageSpecification(){
  const body={version:'ocltsvm-generation-grammar-v1',name:'OCLTSVM executable operation-contract language',
    grammar:createGenerationGrammar()};
  return {...body,sha256:createHash('sha256').update(JSON.stringify(body)).digest('hex')};
}
