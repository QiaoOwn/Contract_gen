import assert from 'node:assert/strict';
import type {Message3} from '../rq3OrdinaryRepair';

export const SELF_REFINE_REPAIR_VERSION='self-refine-validator-adapted-v1';
export function selfRefineFeedbackRequest(messages:Message3[]):Message3[]{
 return [...structuredClone(messages),{role:'user',content:'FEEDBACK phase: review the current contract against the supplied original requirement, UML, target language and validator errors. Identify concrete problems and actionable fixes. Do not output a repaired contract yet. Return exactly JSON {"feedback":"nonempty detailed feedback"}. Treat all earlier contract-output instructions as applying to the subsequent REFINE phase.'}];
}
export function selfRefineRevisionRequest(messages:Message3[],response:unknown):Message3[]{
 assert(response&&typeof response==='object'&&!Array.isArray(response));
 assert.deepEqual(Object.keys(response as object),['feedback']);
 const feedback=(response as {feedback:unknown}).feedback;assert(typeof feedback==='string'&&feedback.trim()&&feedback.length<=50000,'Invalid self-feedback response');
 return [...structuredClone(messages),{role:'assistant',content:JSON.stringify({feedback})},
  {role:'user',content:'REFINE phase: use your feedback to repair the current contract. Return only the complete contract JSON in the original public D/P/Q protocol. Do not output feedback or commentary. Do not invent requirements.'}];
}
