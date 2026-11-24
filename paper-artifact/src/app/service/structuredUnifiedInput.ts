import {SystemMessage, HumanMessage} from '@langchain/core/messages';
import {ccHash} from './crossClauseGraph';
import {compileStructuredTn, assertStructuredTn} from './structuredTnAdapter';
import {assembleUnifiedInputV4, compatibility4, type UnifiedInputBaseline} from './narrativeInputV4';
import {createNarrativeJointProtocol, createNarrativeJointSystemPrompt} from './narrativeJointGeneration';
import {selectOperationRelevantModel} from './operationRelevantModelSelector';
import {compilePackage25} from './crossClausePackage25';
import {MODEL_RULE_FAMILIES, createModelGroundingRules} from './modelGroundingRules';
import type {NarrativeInput} from './narrativeObligationCompiler';
import type {OperationModelGrounding} from './operationModelGrounding';

export function prepareStructuredUnifiedInput(source: NarrativeInput, context: OperationModelGrounding, options: {modelSelection?: boolean} = {}) {
  if (ccHash(createModelGroundingRules(context.index)) !== ccHash(context.rules) ||
    ccHash(source.parameters) !== ccHash(context.index.operation.parameters.map(p => p.name)) ||
    ccHash(source.modelTypes) !== ccHash(context.index.entities.map(e => e.name)) || source.modelHash && source.modelHash !== ccHash(context))
    throw new Error('Structured authority differs from current model');
  const input = {...source, modelHash: ccHash(context)}, plan = compileStructuredTn(input, context);
  const compatibility = compatibility4(input, plan, context);
  const selection = selectOperationRelevantModel(compatibility.projection, context, null, false);
  const pack = compilePackage25(compatibility.projection, context);
  const sections: UnifiedInputBaseline['sections'] = {
    version: 'structured-unified-source-v1', mode: 'E',
    NarrativeRequirement: {text: input.narrativeRequirement, sourceHash: input.sourceHash, sourceType: 'caller-provided-structured'},
    OperationSignature: {service: context.index.operation.service, ...pack.base.signature}, DerivedObligationPlan: plan,
    CrossObligationRelations: {}, ModelContext: selection.inputView, ModelRules: MODEL_RULE_FAMILIES, K: {},
    GenerationProtocol: createNarrativeJointProtocol(plan.planHash, plan.tasks.map(task => task.taskId), plan.unresolved),
  };
  const messages = [new SystemMessage(createNarrativeJointSystemPrompt()), new HumanMessage(JSON.stringify(sections))];
  const baseline = {sections, messages, requestHash: ccHash(messages.map(message => message.content))};
  return assembleUnifiedInputV4(source, context, input, plan, baseline, options,
    (value, candidate) => assertStructuredTn(value, candidate, context));
}
export function assertStructuredUnifiedInput(source: NarrativeInput, context: OperationModelGrounding,
  prepared: ReturnType<typeof prepareStructuredUnifiedInput>, options: {modelSelection?: boolean} = {}) {
  const rebuilt = prepareStructuredUnifiedInput(source, context, options);
  if (prepared.preparationHash !== rebuilt.preparationHash || ccHash(prepared.sections) !== ccHash(rebuilt.sections) ||
    ccHash(prepared.Tn) !== ccHash(rebuilt.Tn) || ccHash(prepared.RoleMapping) !== ccHash(rebuilt.RoleMapping) ||
    ccHash(prepared.R) !== ccHash(rebuilt.R) || ccHash(prepared.K) !== ccHash(rebuilt.K) ||
    ccHash(prepared.compatibility) !== ccHash(rebuilt.compatibility) || ccHash(prepared.selection) !== ccHash(rebuilt.selection) ||
    ccHash(prepared.messages.map(message => message.content)) !== ccHash(rebuilt.messages.map(message => message.content)))
    throw new Error('Structured unified preparation changed');
  return true;
}
