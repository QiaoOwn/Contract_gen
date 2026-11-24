import {HumanMessage, SystemMessage, type BaseMessage} from '@langchain/core/messages';
import {z} from 'zod';
import {taskSolutionSchema} from './constraintSolving';
import {ccHash} from './crossClauseGraph';

export type NarrativeMessage = {role: 'system' | 'user'; content: string};
export type NarrativeMessageRequest = {version: 'narrative-message-dto-v1'; messages: NarrativeMessage[]; messagesHash: string};
export function narrativeMessageRequest(messages: BaseMessage[]): NarrativeMessageRequest {
  const dto = messages.map(message => {
    const type = message._getType();
    if (type !== 'human' && type !== 'system') throw new Error('Unsupported Narrative message type');
    if (typeof message.content !== 'string') throw new Error('Narrative messages must be textual');
    return {role: type === 'human' ? 'user' as const : 'system' as const, content: message.content};
  });
  return {version: 'narrative-message-dto-v1', messages: dto, messagesHash: ccHash(dto)};
}
export function restoreNarrativeMessages(request: NarrativeMessageRequest): BaseMessage[] {
  if (request.version !== 'narrative-message-dto-v1' || ccHash(request.messages) !== request.messagesHash)
    throw new Error('Narrative message identity changed');
  return request.messages.map(message => message.role === 'system' ? new SystemMessage(message.content) : new HumanMessage(message.content));
}
export const publicNarrativeContractSchema = z.object({contract: taskSolutionSchema.shape.contract}).strict();
export type UnifiedContractCandidate = {
  version: 'unified-contract-candidate-v1';
  contract: z.infer<typeof taskSolutionSchema>['contract'];
  provenance: {requirementVersion: string; sourceHash: string; modelHash: string; planHash: string};
  protocol: 'narrative-internal-v1' | 'public-contract-v1';
  internalEvidence: z.infer<typeof taskSolutionSchema>['taskEvidence'] | null;
};
export function decodeNarrativeCandidate(value: unknown, protocol: UnifiedContractCandidate['protocol'],
  provenance: UnifiedContractCandidate['provenance']): UnifiedContractCandidate {
  if (protocol === 'public-contract-v1') {
    const parsed = publicNarrativeContractSchema.parse(value);
    return {version: 'unified-contract-candidate-v1', contract: parsed.contract, provenance: {...provenance}, protocol, internalEvidence: null};
  }
  const parsed = taskSolutionSchema.parse(value);
  if (parsed.planHash !== provenance.planHash) throw new Error('Narrative candidate plan identity mismatch');
  return {version: 'unified-contract-candidate-v1', contract: parsed.contract, provenance: {...provenance}, protocol,
    internalEvidence: parsed.taskEvidence};
}
