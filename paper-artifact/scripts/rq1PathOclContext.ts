import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import type {OperationModelGrounding} from '../src/app/service/operationModelGrounding';

export const pathOclNlpFile='results/pathocl-nlp-v1/terms.json';
const sha=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function readPathOclTerms(id:string){
 const data=JSON.parse(fs.readFileSync(pathOclNlpFile,'utf8'));
 assert.equal(data.version,'pathocl-spacy-terms-v1');
 assert.equal(data.scriptSha256,sha('scripts/prepare_pathocl_nlp.py'));
 assert.equal(data.inputSha256,sha('data/narrative_v3_114/generation/requirements.jsonl'));
 assert.equal(data.modelsSha256[id],sha(`data/narrative_v3_114/generation/models/${id}/typed-model.json`));
 assert(data.records[id]);return data;
}
export function pathOclSelection(context:OperationModelGrounding,id:string){
 const terms=readPathOclTerms(id),entities=context.index.entities;
 const byId=new Map(entities.flatMap(e=>e.features).map(f=>[f.id,f]));
 const features=(e:typeof entities[number])=>e.effectiveFeatureIds.map(id=>{const f=byId.get(id);assert(f);return f;});
 const target=(f:ReturnType<typeof features>[number])=>f.type.kind==='set'?f.type.element?.name:f.type.name;
 const names=new Set(entities.map(e=>e.name));
 const successors=(name:string)=>[...new Set(features(entities.find(e=>e.name===name)!).filter(f=>f.kind==='association')
  .map(target).filter((n):n is string=>!!n&&names.has(n)))].sort();
 const paths:string[][]=[];
 const visit=(path:string[])=>{
  assert(paths.length<100000,'Simple path safety bound exceeded; no truncation or full-model fallback');paths.push(path);
  for(const next of successors(path.at(-1)!))if(!path.includes(next))visit([...path,next]);
 };
 for(const name of [...names].sort())visit([name]);
 assert(paths.length,'No UML class paths available');
 const lemmas=(name:string):string[]=>{assert(terms.identifierLemmas[name],`Missing property lemmas: ${name}`);return terms.identifierLemmas[name];};
 const query=new Set<string>(terms.records[id].queryTerms);
 const ranked=paths.map(path=>{
  const properties=new Set<string>();
  for(const [i,name]of path.entries()){
   const e=entities.find(e=>e.name===name)!;
   for(const lemma of lemmas(name))properties.add(lemma);
   for(const f of features(e))if(f.kind==='attribute'||i+1<path.length&&f.kind==='association'&&target(f)===path[i+1])
    for(const lemma of lemmas(f.name))properties.add(lemma);
  }
  const union=new Set([...query,...properties]);const overlap=[...query].filter(x=>properties.has(x));
  return {path,score:union.size?overlap.length/union.size:0,propertyTerms:[...properties].sort()};
 }).sort((a,b)=>b.score-a.score||a.path.length-b.path.length||(a.path.join('/' )<b.path.join('/')?-1:a.path.join('/')===b.path.join('/')?0:1));
 const selected=ranked[0],included=new Set(selected.path);
 const classes=selected.path.map(name=>{
  const e=entities.find(e=>e.name===name)!,fs=features(e);
  return {class:name,attributes:fs.filter(f=>f.kind==='attribute').map(f=>({[f.name]:f.type.raw})),operations:[],
   associations:fs.filter(f=>f.kind==='association'&&included.has(target(f)!)).map(f=>({role:f.name,target:target(f),
    multiplicity:f.type.kind==='set'?'*':'1'}))};
 });
 const operation=context.index.operation;
 const usedTypes=[...selected.path.flatMap(name=>features(entities.find(e=>e.name===name)!).filter(f=>f.kind==='attribute').map(f=>f.type)),
  ...operation.parameters.map(p=>p.type),...operation.serviceState.map(s=>s.type),...(operation.returnType?[operation.returnType.type]:[])];
 const typeNames=new Set(usedTypes.map(t=>t.kind==='set'?t.element?.name:t.name));
 const enums=context.index.enumerations.filter(e=>typeNames.has(e.name)).map(e=>({name:e.name,
  literals:[...new Set(e.declarations.flatMap(d=>d.literals))]}));
 const operationContext={serviceState:operation.serviceState.map(s=>({name:s.name,type:s.type.raw})),
  enumerations:enums,environment:context.index.environment};
 const typeReferencesWithoutClassDetail=[...new Set(usedTypes.flatMap(t=>{
  const name=t.kind==='set'?t.element?.name:t.name;return name&&names.has(name)&&!included.has(name)?[name]:[];
 }))].sort();
 return {version:'pathocl-selected-context-v2',selected,ranked,classes,operationContext,
  audit:{nlp:terms.nlp,queryTerms:[...query].sort(),enumeratedPaths:paths.length,selectedClasses:selected.path,
   fullClassCount:entities.length,selectedClassCount:classes.length,typeReferencesWithoutClassDetail,
   inheritedAttributes:'Effective source-model attributes flattened without adding off-path class definitions',
   signatureAdaptation:'Service state names/types, referenced enums and environment only; no off-path entity definitions',
   selectionPolicy:'Jaccard top-1; descending score, then shorter path, then ordinal path names',
   source:'https://arxiv.org/html/2405.12450v1#S3'}};
}
