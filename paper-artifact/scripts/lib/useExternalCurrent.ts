import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {Entity} from '../../src/rm2pt/model/Entity';
import {Attribute} from '../../src/rm2pt/model/Attribute';
import {Relationship} from '../../src/rm2pt/model/Relationship';
import {Service} from '../../src/rm2pt/model/Service';
import {Operation} from '../../src/rm2pt/model/Operation';
import {Parameter} from '../../src/rm2pt/model/Parameter';
import {ReturnedType} from '../../src/rm2pt/model/ReturnedType';
import {TempVariable} from '../../src/rm2pt/model/TempVariable';
import {UseCase} from '../../src/rm2pt/model/UseCase';
import {buildModelIndex} from '../../src/app/service/modelIndex';
import {createModelGroundingRules} from '../../src/app/service/modelGroundingRules';
import {ccHash} from '../../src/app/service/crossClauseGraph';
import {prepareStage5Arm} from './contractgenStage5';
import {enhanceFullRequestV2} from './fullGuidedGenerationV2';
import {parseExternalOperationSignature,type ExternalGenerationInput} from '../../data/benchmark/external/use-operation-candidates-v2/evaluation/runtime/generatedCandidateAdapter';
import {createHash} from 'node:crypto';

export const USE_ROOT='data/benchmark/external/use-operation-candidates-v2';
export const USE_ADAPTER=`${USE_ROOT}/evaluation/runtime/generatedCandidateAdapter.ts`;
export type UseRow=ExternalGenerationInput&{source_case:string;model_context:unknown};
export const useRows=():UseRow[]=>fs.readFileSync(`${USE_ROOT}/generation-inputs.jsonl`,'utf8').trim().split(/\r?\n/).map(s=>JSON.parse(s));

/** Read only the literal UML declaration already used by the unchanged backend.
 * No evaluation/reference module is imported and no executable source is evaluated. */
export function externalModelSpecs(){
 const text=fs.readFileSync(USE_ADAPTER,'utf8'),source=ts.createSourceFile(USE_ADAPTER,text,ts.ScriptTarget.Latest,true);
 let declaration:ts.VariableDeclaration|undefined;
 const visit=(n:ts.Node)=>{if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text==='MODEL_SPECS')declaration=n;ts.forEachChild(n,visit);};visit(source);
 assert(declaration?.initializer);
 const literal=(n:ts.Expression):any=>{
  if(ts.isAsExpression(n)||ts.isParenthesizedExpression(n)||ts.isSatisfiesExpression(n))return literal(n.expression);
  if(ts.isStringLiteral(n))return n.text;
  if(ts.isArrayLiteralExpression(n))return n.elements.map(e=>literal(e as ts.Expression));
  if(ts.isObjectLiteralExpression(n))return Object.fromEntries(n.properties.map(p=>{
   assert(ts.isPropertyAssignment(p)&&(ts.isIdentifier(p.name)||ts.isStringLiteral(p.name)),'Nonliteral model declaration');
   return [p.name.text,literal(p.initializer)];
  }));
  throw Error('Executable/nonliteral model data is not permitted');
 };
 return {specs:literal(declaration.initializer),source:{file:USE_ADAPTER,
  line:source.getLineAndCharacterOfPosition(declaration.getStart(source)).line+1,column:1,
  endLine:source.getLineAndCharacterOfPosition(declaration.end).line+1,sha256:createHash('sha256').update(text).digest('hex')}};
}

export function prepareUseCurrent(row:UseRow){
 const authority=externalModelSpecs(),spec=authority.specs[row.project];assert(spec,'Unknown external model');
 const entities:Record<string,Entity>={};
 for(const e of spec.entities)entities[e.name]=new Entity({name:e.name,description:'External USE model declaration',
  attributes:(e.attributes??[]).map((a:any)=>new Attribute({...a,description:''})),
  relationships:(e.relationships??[]).map((r:any)=>new Relationship({name:r.name,relatedEntity:r.type,associationType:'Association',description:''}))});
 for(const e of spec.entities)if(e.extends)entities[e.name].extends=entities[e.extends];
 const signature=parseExternalOperationSignature(row.operation_signature);
 assert.equal(signature.contextType,row.context_type);assert.equal(signature.operationName,row.operation_name);
 const fields:any[]=[];
 const collect=(name:string)=>{const e=spec.entities.find((x:any)=>x.name===name);assert(e);if(e.extends)collect(e.extends);fields.push(...e.attributes??[],...e.relationships??[]);};collect(row.context_type);
 const operation=new Operation({name:signature.operationName,description:row.description,parameters:signature.parameters.map(p=>new Parameter(p)),
  returnType:signature.returnType?new ReturnedType(signature.returnType):undefined,definition:undefined,precondition:'true',postcondition:'true'});
 const service=new Service({name:`External${row.context_type}ContractContext`,operations:[operation],
  tempVariables:fields.map(f=>new TempVariable({name:f.name,type:f.type}))});
 const empty=new Service({name:'ExternalEnvironment',operations:[],tempVariables:[]});
 const useCase=new UseCase({name:row.id,description:row.description,relatedService:service,systemService:empty,involvedActors:[]});
 const index=buildModelIndex({project:row.project,entities,useCaseKey:row.id,useCase,operationName:row.operation_name,resolveSource:()=>authority.source});
 const context={index,rules:createModelGroundingRules(index)};
 // Exactly the existing description. Never reconstruct it from P/Q labels or references.
 const input={operationId:row.id,narrativeRequirement:row.description,sourceHash:ccHash(row.description),
  parameters:index.operation.parameters.map(p=>p.name),modelTypes:index.entities.map(e=>e.name)};
 const stage=prepareStage5Arm(input,context,'E');
 const body={...stage.body,BehavioralRoles:stage.prepared.sections.BehavioralRoleMapping};delete (body as any).TargetLanguage;
 const messages=[{role:'system',content:stage.messages[0].content+' Return clause expression bodies only; no clause headings or Markdown fences.'},
  {role:'user',content:JSON.stringify(body)}];
 const enhanced=enhanceFullRequestV2({method:'full',loaded:{input,context},base:stage,messages,extraction:null,clauseRequests:null,hash:ccHash(messages)});
 return {row,input,context,signature,prepared:stage.prepared,enhanced,messages:enhanced.request.messages,
  sourceIdentity:{descriptionHash:ccHash(row.description),modelHash:ccHash(context),backendModelSource:authority.source,
   sourceFormat:'Existing USE-20 author-normalized description; original explicit Postcondition labels are retained',
   noReferenceAccess:true,noOracleAccess:true},repairEnabled:false,firstGenerationOnly:true};
}
