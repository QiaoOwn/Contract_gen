const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const t = require('@babel/types');
const output = process.argv[process.argv.indexOf('--output') + 1];
if (!output || !path.resolve(output).startsWith(path.resolve('results/rq2-validation-narrative-v1') + path.sep)) throw Error('Invalid purity evidence directory');
const evidence = path.resolve(path.dirname(output), 'checker-boundaries.jsonl');
const original = fs.writeFileSync;
fs.writeFileSync = function(file, data, ...rest) {
 if (String(file).endsWith('entry.ts') && typeof data === 'string' && data.includes('const __semanticSnapshot')) {
  const ast = babel.parseSync(data, {sourceType:'module',parserOpts:{plugins:['typescript']}});
  let count=0;
  babel.traverse(ast, {VariableDeclaration(p) {
   if (!p.node.declarations.some(d=>t.isObjectPattern(d.id)&&d.id.properties.some(k=>t.isObjectProperty(k)&&t.isIdentifier(k.value,{name:'isPostconditionPass'})))) return;
   count++;
   const emit = phase => babel.template.statement.ast(`require('fs').appendFileSync(${JSON.stringify(evidence)}, JSON.stringify({phase:${JSON.stringify(phase)},state:__semanticSnapshot(this, [], result)}) + '\\n');`);
   p.insertBefore(emit('before'));p.insertAfter(emit('after'));
  }});
  if(count!==1) throw Error(`Expected one checker boundary, found ${count}`);
  data=require('@babel/generator').default(ast).code;
 }
 return original.call(this,file,data,...rest);
};
require('./rq2_validation_capture_offline.cjs');
