import {createHash} from 'node:crypto';
import type {BaseMessage} from '@langchain/core/messages';

// Trace only the logical messages; credentials and transport configuration never enter this object.
export const generationMessageTrace = (model: string, messages: BaseMessage[]) => {
  const recorded = messages.map((message) => ({
    type: message._getType(),
    content: message.content,
  }));
  return {
    schemaVersion: 'generation-message-trace-v1',
    model,
    messages: recorded,
    messagesHash: createHash('sha256').update(JSON.stringify(recorded)).digest('hex'),
  };
};

export type GenerationMessageTrace = ReturnType<typeof generationMessageTrace>;
