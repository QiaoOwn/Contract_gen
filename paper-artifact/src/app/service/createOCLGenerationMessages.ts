import {AIMessage, BaseMessage, HumanMessage, SystemMessage} from '@langchain/core/messages';
import {createCommonTypescriptErrorPrompt} from './createCommonTypescriptErrorPrompt';
import {createOCLGenerationSystemPrompt} from './createOCLGenerationSystemPrompt';
import type {GenerateOCLFeedbackMode} from './generateOCL';
import {isModelRuleDiagnostic, renderModelRuleRepair} from './modelRuleDiagnostics';
import {renderBehaviorRepairDiagnostics, type RepairDiagnostic} from './repairDiagnostics';
import {isCandidateRepair} from './repairTaxonomy';

type Diagnostic = {line: number; column: number; msg: string; code?: string};

export const genericFeedbackMessage =
  'The previous candidate failed validation. Please generate a revised OCL operation contract.';
export const candidateOnlyRefinementMessage =
  'Here is a previous OCL operation contract candidate. Please revise it into a complete candidate that satisfies the task and required output format.';
export const rawFeedbackMessage =
  'The previous candidate failed validation. Revise it using the unclassified validator output below.';

export const createOCLGenerationMessages = (param: {
  messages: BaseMessage[];
  feedbackMode: GenerateOCLFeedbackMode;
  previousOcl?: {definition: string; precondition: string; postcondition: string};
  contract?: string;
  contractErrors?: Diagnostic[];
  typescriptErrors?: Diagnostic[];
  repairDiagnostics?: RepairDiagnostic[];
}) => {
  const systemPrompt = createOCLGenerationSystemPrompt();
  const messages: BaseMessage[] = [new SystemMessage(systemPrompt.text), ...param.messages];
  if (param.repairDiagnostics?.some((item) => !isCandidateRepair(item))) {
    return {messages, systemPrompt, hasError: false};
  }
  const hasError =
    (param.contractErrors?.length || 0) > 0 ||
    (param.typescriptErrors?.length || 0) > 0 ||
    Boolean(
      param.repairDiagnostics?.some((item) => item.stage === 'development' && item.repairEligible)
    );

  // Repair treatments receive the same candidate. Their only difference is
  // whether the follow-up exposes no failure status, generic failure status,
  // unclassified raw diagnostics, or stage-specific diagnostics.
  if (hasError && param.feedbackMode !== 'none' && param.previousOcl) {
    messages.push(new AIMessage(JSON.stringify(param.previousOcl, null, 2)));
  }

  const feedback: string[] = [];
  if (hasError && param.feedbackMode === 'candidate') {
    feedback.push(candidateOnlyRefinementMessage);
  } else if (hasError && param.feedbackMode === 'generic') {
    feedback.push(genericFeedbackMessage);
  } else if (hasError && param.feedbackMode === 'raw') {
    feedback.push(rawFeedbackMessage);
    if ((param.contractErrors?.length || 0) > 0 && param.contract) {
      feedback.push(param.contract);
    }
    [...(param.contractErrors || []), ...(param.typescriptErrors || [])].forEach((error) => {
      feedback.push(`line ${error.line}, column ${error.column}: ${error.msg}`);
    });
    param.repairDiagnostics
      ?.filter((item) => item.stage === 'development' && item.repairEligible)
      .forEach((item) => feedback.push(item.msg));
  } else if ((param.contractErrors?.length || 0) > 0 && param.feedbackMode === 'full') {
    feedback.push(
      'The previous candidate failed at the REMODEL contract-validation stage. Repair the three JSON fields using these parser or generation-semantics diagnostics:'
    );
    feedback.push('Assembled contract:');
    feedback.push(param.contract || '');
    param.contractErrors!.forEach((error) => {
      if (isModelRuleDiagnostic(error)) return;
      feedback.push(
        `[contract-validation${error.code ? `/${error.code}` : ''}] line ${error.line}, column ${error.column}: ${error.msg}`
      );
    });
    const modelErrors = param.contractErrors!.filter(isModelRuleDiagnostic);
    if (modelErrors.length) feedback.push(renderModelRuleRepair(modelErrors));
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
  if (param.feedbackMode === 'full') {
    param.repairDiagnostics
      ?.filter((item) => item.code === 'TASK_REQUIRED_REFERENCE_MISSING')
      .forEach((item) => {
        feedback.push(`Program task ${item.obligationIds.join(', ')}: ${item.msg}`);
        feedback.push(item.repair);
        item.modelEvidence.forEach((evidence) =>
          feedback.push(`Read-only model declaration: ${evidence.declaration} [${evidence.id}]`)
        );
      });
  }
  if (
    param.feedbackMode === 'full' &&
    param.repairDiagnostics?.some((item) => item.stage === 'development' && item.repairEligible)
  ) {
    feedback.push(renderBehaviorRepairDiagnostics(param.repairDiagnostics));
  }
  if (feedback.length) {
    messages.push(new HumanMessage(feedback.join('\n')));
  }

  return {messages, systemPrompt, hasError};
};
