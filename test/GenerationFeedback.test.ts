import {HumanMessage} from '@langchain/core/messages';
import {
  createOCLGenerationMessages,
  genericFeedbackMessage,
} from '@/app/service/createOCLGenerationMessages';

const previousOcl = {
  definition: 'user:User = User.allInstances()->any(u | u.Id = id)',
  precondition: 'user.oclIsUndefined() = false',
  postcondition: 'result = true',
};

const build = (feedbackMode: 'generic' | 'full') =>
  createOCLGenerationMessages({
    messages: [new HumanMessage('operation input')],
    feedbackMode,
    previousOcl,
    contract: 'Contract Service::operation() { precondition: true postcondition: true }',
    contractErrors: [{line: 2, column: 4, msg: 'parser failure'}],
  }).messages;

describe('generation feedback treatments', () => {
  test('none omits the previous candidate and all validation feedback', () => {
    const messages = createOCLGenerationMessages({
      messages: [new HumanMessage('operation input')],
      feedbackMode: 'none',
      previousOcl,
      contract: 'Contract Service::operation() { precondition: true postcondition: true }',
      contractErrors: [{line: 2, column: 4, msg: 'parser failure'}],
      typescriptErrors: [{line: 3, column: 5, msg: 'TypeScript failure'}],
    }).messages;
    const text = messages.map((message) => String(message.content)).join('\n');

    expect(messages.filter((message) => message.getType() === 'ai')).toHaveLength(0);
    expect(text).toContain('operation input');
    expect(text).not.toContain(previousOcl.precondition);
    expect(text).not.toContain('parser failure');
    expect(text).not.toContain('TypeScript failure');
    expect(text).not.toContain('failed validation');
  });

  test.each(['generic', 'full'] as const)('%s receives the previous candidate', (mode) => {
    const messages = build(mode);
    const candidates = messages.filter((message) => message.getType() === 'ai');

    expect(candidates).toHaveLength(1);
    expect(candidates[0].content).toContain(previousOcl.precondition);
  });

  test('generic feedback omits stage diagnostics', () => {
    const text = build('generic')
      .map((message) => String(message.content))
      .join('\n');

    expect(text).toContain('failed validation');
    expect(text).not.toContain('parser failure');
    expect(text).not.toContain('line 2');
  });

  test('generic feedback is identical across validation stages', () => {
    const parserMessages = build('generic');
    const typescriptMessages = createOCLGenerationMessages({
      messages: [new HumanMessage('operation input')],
      feedbackMode: 'generic',
      previousOcl,
      typescriptErrors: [{line: 7, column: 9, msg: 'stage-specific TypeScript failure'}],
    }).messages;
    const lastText = (messages: typeof parserMessages) => String(messages.at(-1)?.content);

    expect(lastText(parserMessages)).toBe(genericFeedbackMessage);
    expect(lastText(typescriptMessages)).toBe(genericFeedbackMessage);
    expect(lastText(typescriptMessages)).not.toContain('TypeScript');
    expect(lastText(typescriptMessages)).not.toContain('line 7');
  });

  test('full feedback includes stage diagnostics', () => {
    const text = build('full')
      .map((message) => String(message.content))
      .join('\n');

    expect(text).toContain('parser failure');
    expect(text).toContain('line 2, column 4');
  });
});
