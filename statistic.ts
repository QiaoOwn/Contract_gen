import * as project from './src/rm2pt/project';
import 'colors';
const types: string[] = [];
Object.values(project).map((e) => {
  Object.values(e.entity).map((e) => {
    e.attributes.map((e) => {
      types.push(e.type);
    });
  });
});
console.log('共有基础类型：'.yellow);
console.log(JSON.stringify([...new Set(types)], null, 2).green);
