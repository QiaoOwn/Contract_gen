import {ccHash} from './crossClauseGraph';
import {z} from 'zod';
import {segmentNarrative} from './narrativeSegmentation';

export type NarrativeInput = {
  operationId: string;
  narrativeRequirement: string;
  sourceHash: string;
  parameters: string[];
  modelTypes: string[];
  modelHash?: string;
};
export type NarrativeObligation = {
  taskId: string;
  category: 'precondition' | 'postcondition' | 'unresolved';
  obligationText: string;
  sourceSpans: {start: number; end: number; exactText: string}[];
  referencedRoles: string[];
  referencedParameters: string[];
  extractionStatus: 'explicit' | 'inferred-candidate' | 'ambiguous';
  provenance: string[];
  rationale: string;
  candidateCategories?: Array<'precondition' | 'postcondition' | 'unresolved'>;
  contextSpans?: {start: number; end: number; exactText: string}[];
  kinds?: string[];
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text: string, names: string[]) => names.filter(name =>
  new RegExp(`\\b${escape(name)}\\b`, 'i').test(text));

/** Conservative surface extraction, not a general natural-language semantic parser. */
export function compileNarrativeObligations(input: NarrativeInput) {
  if (ccHash(input.narrativeRequirement) !== input.sourceHash) throw new Error('Narrative source hash mismatch');
  if (/^\s*(?:Preconditions|Postconditions|Operation intent)\s*:/im.test(input.narrativeRequirement))
    throw new Error('Structured task headings are not narrative input');
  const tasks: NarrativeObligation[] = [];
  const segments = segmentNarrative(input.narrativeRequirement);
  const intentSpans: {start: number; end: number; exactText: string}[] = [];
  const annotationSpans: {start: number; end: number; exactText: string}[] = [];
  for (const segment of segments) {
    const match = {0: segment.text, index: segment.start};
    const raw = match[0];
    const text = raw.trim();
    if (!text) continue;
    const start = match.index! + raw.indexOf(text);
    if (/^(?:this restriction is a laboratory-adjudicated requirement|this is a laboratory-adjudicated requirement)\.?$/i.test(text)) {
      annotationSpans.push({start, end: start + text.length, exactText: text});
      continue;
    }
    if (/^The operation (?:retrieves|adds|applies|registers|marks|reads|withdraws|places|pays|processes|renews)\b/i.test(text)) {
      intentSpans.push({start, end: start + text.length, exactText: text});
      continue;
    }
    if (/^(?:this means|in other words)\b/i.test(text) && tasks.length) {
      const previous = tasks.at(-1)!;
      previous.sourceSpans.push({start, end: start + text.length, exactText: text});
      previous.obligationText = previous.sourceSpans.map(span => span.exactText).join(' ');
      previous.extractionStatus = 'inferred-candidate';
      continue;
    }
    const conditional = /\b(if|when|unless|otherwise|except)\b/i.test(text);
    const pre = /\b(?:must|shall) (?:not\s+)?(?:exist|be|have|identify|cover|exceed)\b|\brequires?\b|\bonly (?:if|when)\b/i.test(text) ||
      (!!segment.context && /\bmust|requires?\b/i.test(segment.context.exactText) &&
        (/^(?:be|have|has|is|are)\b/i.test(text) || /\bexists?\b/i.test(text)));
    const post = /\b(?:returns?|creates?|deletes?|removes?|updates?|sets|stores|adds?|reduces?|increases?|decreases?|rejects?|becomes?|records?|timestamps?|marks?|makes?|links?|closes?|clears?|starts?)\b/i.test(text) ||
      /\bis (?:created|linked|extended)\b|\bdue date is \d+/i.test(text);
    const category = conditional || (pre && post) ? 'unresolved' : pre ? 'precondition' : post ? 'postcondition' : 'unresolved';
    tasks.push({taskId: `${input.operationId}/narrative-task/${tasks.length + 1}`,
      category, obligationText: text, sourceSpans: [{start, end: start + text.length, exactText: text}],
      referencedRoles: mentions(text, input.modelTypes), referencedParameters: mentions(text, input.parameters),
      candidateCategories: conditional ? ['postcondition', 'unresolved'] : category === 'unresolved' ? ['precondition', 'postcondition', 'unresolved'] : [category],
      contextSpans: segment.context ? [segment.context] : [],
      kinds: [
        /\bexist\w*\b/i.test(text) && 'existence', /\bstatus|state|NORMAL|LSOPEN\b/i.test(text) && 'state',
        /\bcreat\w*\b/i.test(text) && 'creation', /\bdelet\w*|remov\w*\b/i.test(text) && 'deletion',
        /\blink\w*|associat\w*\b/i.test(text) && 'association', /\breturn\w*\b/i.test(text) && 'return',
        /\bamount|quantity|stock|fewer|balance|count\b/i.test(text) && 'quantity',
        /\bdecreas\w*|increas\w*|becomes?|sets|updates?|extended\b/i.test(text) && 'state-change',
        conditional && 'conditional', /\bnot|no|unused|unvalidated\b/i.test(text) && 'negation',
      ].filter((kind): kind is string => typeof kind === 'string'),
      extractionStatus: category === 'unresolved' ? 'ambiguous' : segment.context &&
        !/\bmust|shall|requires?\b/i.test(text) && category === 'precondition' ? 'inferred-candidate' : 'explicit',
      provenance: ['narrative-surface-compiler-v2', input.sourceHash],
      rationale: conditional ? 'Conditional or trigger scope requires interpretation; no fixed Pre mapping.' :
        category === 'unresolved' ? 'No unique supported clause classification.' : 'Explicit surface cue; semantic completeness is not established.'});
  }
  const contradictions = tasks.filter(task => /\bmust not exist\b/i.test(task.obligationText)).flatMap(negative =>
    tasks.filter(positive => positive.taskId !== negative.taskId && /\bmust exist\b/i.test(positive.obligationText) &&
      positive.obligationText.split(/\bmust\b/i)[0].trim().toLowerCase() === negative.obligationText.split(/\bmust\b/i)[0].trim().toLowerCase())
      .map(positive => [negative.taskId, positive.taskId]));
  for (const id of contradictions.flat()) {const task = tasks.find(task => task.taskId === id)!; task.category = 'unresolved'; task.extractionStatus = 'ambiguous';}
  const operationNames = [...input.narrativeRequirement.matchAll(/\boperation\s+([a-z_]\w*)\s+(?:requires|returns|creates|must)\b/gi)].map(match => match[1]);
  const boundaryAmbiguous = new Set(operationNames).size > 1;
  if (boundaryAmbiguous) for (const task of tasks) {task.category = 'unresolved'; task.extractionStatus = 'ambiguous';}
  const body = {version: 'narrative-obligation-plan-v2', operationId: input.operationId, intentSpans, annotationSpans, contradictions,
    boundaryAmbiguous,
    noAdditionalPreconditionDeclared: /\bno additional business condition (?:is )?required\b/i.test(input.narrativeRequirement),
    sourceHash: input.sourceHash, inputIdentityHash: ccHash(input), tasks, unresolved: tasks.filter(task => task.category === 'unresolved').map(task => task.taskId),
    missingInformation: tasks.some(task => /\breturns?\b/i.test(task.obligationText)) ? [] : ['No explicit return behavior identified'],
    semanticCompletenessProven: false};
  return {...body, planHash: ccHash(body)};
}

export function assertNarrativePlan(input: NarrativeInput, plan: ReturnType<typeof compileNarrativeObligations>) {
  if (ccHash(plan) !== ccHash(compileNarrativeObligations(input))) throw new Error('Narrative plan/source altered');
  return true;
}

export type NarrativeExtractionProposal = {sourceHash: string; obligations: NarrativeObligation[]};
export const narrativeExtractionSchema = z.object({
  sourceHash: z.string().min(1),
  obligations: z.array(z.object({
    taskId: z.string().min(1), category: z.enum(['precondition', 'postcondition', 'unresolved']),
    obligationText: z.string().min(1),
    sourceSpans: z.array(z.object({start: z.number().int().nonnegative(), end: z.number().int().positive(), exactText: z.string().min(1)}).strict()).min(1),
    referencedRoles: z.array(z.string()), referencedParameters: z.array(z.string()),
    extractionStatus: z.enum(['explicit', 'inferred-candidate', 'ambiguous']),
    provenance: z.array(z.string()).min(1), rationale: z.string().min(1),
    candidateCategories: z.array(z.enum(['precondition', 'postcondition', 'unresolved'])).optional(),
    contextSpans: z.array(z.object({start: z.number().int().nonnegative(), end: z.number().int().positive(), exactText: z.string()}).strict()).optional(),
    kinds: z.array(z.string()).optional(),
  }).strict()),
}).strict();

/** Injected transport only; proposal acceptance proves provenance, never semantic correctness. */
export async function proposeNarrativeExtraction(input: NarrativeInput,
  transport?: (request: NarrativeInput) => Promise<unknown>) {
  compileNarrativeObligations(input);
  if (!transport) return {modelCalls: 0, proposal: null};
  const before = ccHash(input);
  const raw = await transport(structuredClone(input));
  if (ccHash(input) !== before) throw new Error('Extraction input altered');
  if (!raw || typeof raw !== 'object') throw new Error('Invalid extraction envelope');
  const proposal = narrativeExtractionSchema.parse(raw);
  if (proposal.sourceHash !== input.sourceHash || !Array.isArray(proposal.obligations)) throw new Error('Invalid extraction identity');
  const ids = new Set<string>();
  for (const task of proposal.obligations) {
    if (!task || typeof task.taskId !== 'string' || ids.has(task.taskId) ||
      !['precondition', 'postcondition', 'unresolved'].includes(task.category) ||
      typeof task.obligationText !== 'string' || !Array.isArray(task.sourceSpans) || !task.sourceSpans.length ||
      !Array.isArray(task.referencedRoles) || !Array.isArray(task.referencedParameters)) throw new Error('Invalid obligation schema');
    if (!task.taskId.startsWith(`${input.operationId}/narrative-task/`)) throw new Error('Wrong operation task identity');
    ids.add(task.taskId);
    for (const span of [...task.sourceSpans, ...(task.contextSpans ?? [])]) {
      if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.end <= span.start ||
        span.end > input.narrativeRequirement.length || input.narrativeRequirement.slice(span.start, span.end) !== span.exactText)
        throw new Error('Unsupported extraction span');
    }
    // The executable candidate retains source wording; semantic paraphrases require a separate reviewed layer.
    if (task.obligationText !== task.sourceSpans.map(span => span.exactText).join(' '))
      throw new Error('Obligation text is not the cited source wording');
    if (task.referencedRoles.some(role => !input.modelTypes.includes(role)) ||
      task.referencedParameters.some(parameter => !input.parameters.includes(parameter))) throw new Error('Unknown model declaration');
  }
  return {modelCalls: 1, proposal, semanticReviewRequired: true};
}
