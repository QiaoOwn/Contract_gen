import {SystemMessage, HumanMessage} from '@langchain/core/messages';
import {loadCollaborativeOperation} from '../../src/app/service/crossClauseOperation';
import {createConstraintSolvingSystemPrompt} from '../../src/app/service/constraintSolving';
import {prepareConstraintGeneration} from '../../src/app/service/constraintTaskPlan';
import {compilePackage25} from '../../src/app/service/crossClausePackage25';
import {prepareCollaborativeRequest25} from '../../src/app/service/crossClauseCollaborative25';
import {generationMessageTrace} from '../../src/app/service/generationMessageTrace';

// Only canonical generation input is returned. No historical candidate or Oracle is read here.
export function buildNaturalRequests(operationId: string, model = 'gpt-5.5') {
  const {input} = loadCollaborativeOperation(operationId);
  const params = {plan: input.constraintTaskPlan!, context: input.modelGroundingContext, input: input.content,
    requirement: input.requirement, inputHash: input.metadata.inputHash, model: model as never,
    apiKey: 'unused-preparation', baseURL: 'https://unused.invalid/v1', diagnostics: []};
  prepareConstraintGeneration(params);
  // Exact first-attempt v4 construction: the existing exported system and canonical user message.
  const B = generationMessageTrace(model, [new SystemMessage(createConstraintSolvingSystemPrompt()), new HumanMessage(input.content)]);
  const pack = compilePackage25(params.plan, params.context);
  const C = prepareCollaborativeRequest25(params, pack, true).trace;
  if (B.messages.length !== 2 || C.messages.length !== 3 || B.messages[1].content !== C.messages[1].content ||
      !String(C.messages[0].content).startsWith(String(B.messages[0].content))) throw new Error('Unexpected B/C base-input difference');
  return {operationId, params, pack, requests: {B, C}, candidateOrigin: 'natural-first-generation' as const};
}
export type NaturalCase = ReturnType<typeof buildNaturalRequests>;
