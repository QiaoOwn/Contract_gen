import {ccHash} from './crossClauseGraph';
import {assertNarrativePlan, type NarrativeInput, type compileNarrativeObligations} from './narrativeObligationCompiler';
import {resolveNarrativeRoles} from './narrativeRoleResolver';
import type {compileNarrativeCompatibility} from './narrativeCompatibility';
import type {RelationType} from './obligationRelationCompiler';

export function compileNarrativeRelations(input: NarrativeInput, tn: ReturnType<typeof compileNarrativeObligations>,
  compatibility: ReturnType<typeof compileNarrativeCompatibility>) {
  assertNarrativePlan(input, tn);
  const roles = resolveNarrativeRoles(input, tn);
  const relations: {id: string; type: RelationType; from: string[]; to: string[]; status: 'grounded' | 'proposed' | 'unresolved';
    enforceability: 'advisory' | 'not-checkable'; sourceSpans: typeof tn.tasks[number]['sourceSpans']; modelCandidates: string[]; reason: string}[] = [];
  const add = (type: RelationType, from: string[], to: string[], status: 'grounded' | 'proposed' | 'unresolved', reason: string, modelCandidates: string[] = []) => {
    const sourceSpans = [...new Set([...from, ...to])].flatMap(id => tn.tasks.find(task => task.taskId === id)?.sourceSpans ?? []);
    const id = `${input.operationId}/narrative-R/${ccHash({type, from, to}).slice(0, 16)}`;
    if (!relations.some(relation => relation.id === id)) relations.push({id, type, from, to, status,
      enforceability: status === 'unresolved' ? 'not-checkable' : 'advisory', sourceSpans, modelCandidates, reason});
  };
  for (const relation of compatibility.legacyRelations?.relations ?? []) {
    const map = (ids: string[]) => ids.map(id => compatibility.mapping.find(mapping => mapping.projectionTaskId === id)!.narrativeTaskId);
    add(relation.relationType, map(relation.sourceTaskIds), map(relation.targetTaskIds), relation.verificationStatus,
      `Reused R compiler on derived view: ${relation.rationale}`, relation.modelCandidates);
  }
  for (const relation of roles.relations) {
    const target = roles.mentions.find(mention => mention.id === relation.targetMention)!;
    const antecedents = relation.sourceMentions.map(id => roles.mentions.find(mention => mention.id === id)!);
    add('same-target', antecedents.map(mention => mention.taskId), [target.taskId], relation.status,
      'Anaphoric candidates retain all possible antecedents; type equality is not business identity.');
    if (antecedents.length === 1 && tn.tasks.find(task => task.taskId === antecedents[0].taskId)?.kinds?.includes('creation'))
      add('create-use', [antecedents[0].taskId], [target.taskId], 'proposed', 'Unique preceding source mention in creation clause, not proved object identity.');
  }
  for (const task of tn.tasks) {
    if (task.kinds?.includes('conditional')) add('conditional-effect', [task.taskId], [task.taskId], 'proposed', 'Explicit conditional source; branch guard meaning remains to be interpreted.');
    if (task.kinds?.includes('state-change')) add('pre-post-state', [task.taskId], [task.taskId], 'grounded', 'Explicit source change cue; no update equation is precomputed.');
  }
  for (const parameter of input.parameters) {
    const related = tn.tasks.filter(task => task.referencedParameters.includes(parameter));
    if (related.length > 1) add('same-quantity', [related[0].taskId], related.slice(1).map(task => task.taskId), 'grounded',
      `Exact formal parameter occurrence: ${parameter}; use semantics remain advisory.`);
  }
  const body = {version: 'narrative-relation-plan-v1', sourceHash: input.sourceHash, planHash: tn.planHash,
    roles, relations, hardBusinessConstraints: 0};
  return {...body, hash: ccHash(body)};
}
