import {AIMessage, BaseMessage, HumanMessage, SystemMessage} from '@langchain/core/messages';
import {createCommonTypescriptErrorPrompt} from './createCommonTypescriptErrorPrompt';
import {createOCLGenerationSystemPrompt} from './createOCLGenerationSystemPrompt';
import type {GenerateOCLFeedbackMode} from './generateOCL';

type Diagnostic = {line: number; column: number; msg: string};

export const genericFeedbackMessage =
  'The previous candidate failed validation. Please generate a revised OCL operation contract.';

export const createOCLGenerationMessages = (param: {
  messages: BaseMessage[];
  feedbackMode: GenerateOCLFeedbackMode;
  previousOcl?: {definition: string; precondition: string; postcondition: string};
  contract?: string;
  contractErrors?: Diagnostic[];
  typescriptErrors?: Diagnostic[];
}) => {
  const systemPrompt = createOCLGenerationSystemPrompt();
  const messages: BaseMessage[] = [new SystemMessage(systemPrompt.text), ...param.messages];
  const hasError =
    (param.contractErrors?.length || 0) > 0 || (param.typescriptErrors?.length || 0) > 0;

  // Both repair treatments receive the same candidate. Their only difference
  // is whether validation diagnostics are generic or stage-specific.
  if (hasError && param.feedbackMode !== 'none' && param.previousOcl) {
    messages.push(new AIMessage(JSON.stringify(param.previousOcl, null, 2)));
  }

  const feedback: string[] = [];
  if (hasError && param.feedbackMode === 'generic') {
    feedback.push(genericFeedbackMessage);
  } else if ((param.contractErrors?.length || 0) > 0 && param.feedbackMode === 'full') {
    feedback.push(
      'The previous candidate failed at the REMODEL contract-validation stage. Repair the three JSON fields using these parser or generation-semantics diagnostics:'
    );
    feedback.push('Assembled contract:');
    feedback.push(param.contract || '');
    param.contractErrors!.forEach((error) => {
      feedback.push(
        `[contract-validation] line ${error.line}, column ${error.column}: ${error.msg}`
      );
    });
  }
  if ((param.typescriptErrors?.length || 0) > 0 && param.feedbackMode === 'full') {
    feedback.push(
      'The previous candidate failed during OCL-to-TypeScript lowering or compilation. Repair the OCL fields using these diagnostics:'
    );
    param.typescriptErrors!.forEach((error) => {
      feedback.push(`[ocltsvm] line ${error.line}, column ${error.column}: ${error.msg}`);
    });
    feedback.push(createCommonTypescriptErrorPrompt());
  }
  if (feedback.length) {
    messages.push(new HumanMessage(feedback.join('\n')));
  }

  return {messages, systemPrompt, hasError};
};
