import type {ConstraintTaskPlan} from './constraintTaskPlan';
import type {OperationModelGrounding} from './operationModelGrounding';
import {modelDeclarations} from './modelDeclarations';
import type {IndexedType} from './modelIndex';
import {ccHash} from './crossClauseGraph';
import {containsWord, type ObligationRelationPlan} from './obligationRelationCompiler';

const typeName = (type: IndexedType): string | undefined => type.kind === 'set' ? typeName(type.element!) : type.name;
const splitName = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
const mentionsEntity = (text: string, name: string) => {
  const normalized = ` ${splitName(text).replace(/[-_]/g, ' ')} `;
  const phrase = splitName(name), plural = /[^aeiou]y$/i.test(phrase) ? `${phrase.slice(0, -1)}ies` : `${phrase}s`;
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return containsWord(text, name) || new RegExp(`\\b(?:${escape(phrase)}|${escape(plural)})\\b`, 'i').test(normalized);
};

export function selectOperationRelevantModel(plan: ConstraintTaskPlan, context: OperationModelGrounding, R: ObligationRelationPlan | null, enabled = true) {
  const index = context.index, full = modelDeclarations(index), before = ccHash(context);
  const selected = new Set<string>(), reasons = new Map<string, Set<string>>(), fallbackReasons: string[] = [];
  const add = (id: string, reason: string) => {selected.add(id); if (!reasons.has(id)) reasons.set(id, new Set()); reasons.get(id)!.add(reason);};
  const text = [plan.intent, ...plan.tasks.map(task => task.requirement)].join('\n');
  const signatureNames = new Set([...index.operation.parameters.map(parameter => typeName(parameter.type)),
    ...(index.operation.returnType ? [typeName(index.operation.returnType.type)] : [])]);
  const roots = index.entities.filter(entity => mentionsEntity(text, entity.name) || signatureNames.has(entity.name));
  const expandedOwners = new Set(roots.map(entity => entity.name));
  const parameterIds = new Set(index.operation.parameters.map(parameter => parameter.id));
  for (const parameter of index.operation.parameters) add(parameter.id, 'Signature parameter');
  if (index.operation.returnType) add(index.operation.returnType.id, 'Signature return type');
  // NL may describe a state through a role/collection alias. Retain the complete
  // declared service frame instead of guessing that an unmentioned binder is unusable.
  for (const state of index.operation.serviceState) add(state.id, 'Complete declared service-state frame; no state-use semantics inferred');
  const unresolvedTasks = plan.tasks.filter(task => !index.entities.some(entity => mentionsEntity(task.requirement, entity.name)) &&
    !index.operation.parameters.some(parameter => containsWord(task.requirement, parameter.name)) &&
    !index.operation.serviceState.some(state => splitName(task.requirement).includes(splitName(state.name))) &&
    !/^The operation returns\b/i.test(task.requirement));
  if (!enabled) fallbackReasons.push('Model selection disabled');
  if (!roots.length) fallbackReasons.push('No explicit entity anchor in source intent/tasks');
  if (unresolvedTasks.length) fallbackReasons.push(`Unresolved declaration needs for tasks: ${unresolvedTasks.map(task => task.id).join(', ')}`);
  if (index.issues.length) fallbackReasons.push('Authoritative index has unresolved issues');
  const modelPaths: {from: string; to: string; featureIds: string[]; source: string}[] = [];
  // Find all shortest directed paths up to three hops. Longer required paths fall back to full context.
  for (const from of roots) for (const to of roots) {
    if (from.name === to.name) continue;
    const queue = [{name: from.name, path: [] as string[], visited: [from.name]}];
    let shortest: number | null = null;
    while (queue.length) {
      const state = queue.shift()!;
      if (state.path.length >= 3 || (shortest !== null && state.path.length >= shortest)) continue;
      for (const feature of index.entities.find(entity => entity.name === state.name)!.features.filter(feature => feature.kind === 'association')) {
        const target = typeName(feature.type);
        if (!target || !index.entities.some(entity => entity.name === target) || state.visited.includes(target)) continue;
        const path = [...state.path, feature.id];
        if (target === to.name) {
          shortest = path.length;
          modelPaths.push({from: from.id, to: to.id, featureIds: path, source: 'Actual directed model associations; navigation possibility, not a required business effect'});
          state.visited.forEach(owner => expandedOwners.add(owner)); expandedOwners.add(target);
        } else queue.push({name: target, path, visited: [...state.visited, target]});
      }
    }
    if (modelPaths.length > 64) fallbackReasons.push('Too many alternative model navigation paths');
    if (!modelPaths.some(path => path.from === from.id && path.to === to.id)) {
      const pending = [{name: from.name, depth: 0}], visited = new Set([from.name]);
      while (pending.length) {
        const node = pending.shift()!;
        if (node.name === to.name) {if (node.depth > 3) fallbackReasons.push(`Navigation ${from.name} to ${to.name} needs more than three hops`); break;}
        for (const feature of index.entities.find(entity => entity.name === node.name)!.features.filter(feature => feature.kind === 'association')) {
          const target = typeName(feature.type);
          if (target && index.entities.some(entity => entity.name === target) && !visited.has(target)) {visited.add(target); pending.push({name: target, depth: node.depth + 1});}
        }
      }
    }
  }
  // Unqualified navigation language with no resolved model route is not truncated to one hop.
  if (/\b(through|navigate|via|transitive|nested)\b/i.test(text) && modelPaths.length === 0) fallbackReasons.push('Navigation intent has no bounded resolved path');
  const requireType = (type: IndexedType): void => {
    if (type.kind === 'set') return requireType(type.element!);
    if (type.kind === 'unsupported') {fallbackReasons.push(`Unsupported visible type ${type.raw}`); return;}
    if (type.kind === 'named') {
      const entity = index.entities.find(entity => entity.name === type.name);
      if (entity) add(entity.id, 'Named-type closure');
      else if (!index.enumerations.some(enumeration => enumeration.name === type.name)) fallbackReasons.push(`Missing named type ${type.name}`);
    }
  };
  for (const name of [...expandedOwners]) {
    let entity = index.entities.find(entity => entity.name === name);
    const seen = new Set<string>();
    while (entity && !seen.has(entity.name)) {
      seen.add(entity.name); add(entity.id, `Source-mentioned or navigation owner ${name}`);
      entity.features.forEach(feature => {add(feature.id, `All features of anchored/ancestor owner ${name}; no modelHints identity inference`); requireType(feature.type);});
      if (entity.base) {expandedOwners.add(entity.base); entity = index.entities.find(candidate => candidate.name === entity!.base);} else break;
    }
  }
  for (const parameter of index.operation.parameters) requireType(parameter.type);
  if (index.operation.returnType) requireType(index.operation.returnType.type);
  for (const state of index.operation.serviceState.filter(state => selected.has(state.id))) requireType(state.type);
  if (R) for (const relation of R.relations) for (const id of relation.modelCandidates) {
    const declaration = full.find(declaration => declaration.id === id);
    if (declaration && (selected.has(id) || parameterIds.has(id))) add(id, `R ${relation.relationId}: candidate checked against selected owner/type closure; no business identity inferred`);
  }
  // Ancestors of header-only targets are visible too; no target features are guessed from hints.
  let changed = true;
  while (changed) {
    changed = false;
    for (const entity of index.entities.filter(entity => selected.has(entity.id))) if (entity.base) {
      const base = index.entities.find(base => base.name === entity.base);
      if (!base) fallbackReasons.push(`Missing ancestor ${entity.base}`);
      else if (!selected.has(base.id)) {add(base.id, 'Ancestor type closure'); changed = true;}
    }
  }
  const fallback = fallbackReasons.length > 0;
  if (fallback) full.forEach(declaration => add(declaration.id, 'Full-model fallback'));
  const declarations = full.filter(declaration => selected.has(declaration.id));
  const ids = new Set(declarations.map(declaration => declaration.id));
  const features = index.entities.flatMap(entity => entity.features).filter(feature => ids.has(feature.id));
  const visibleTypes = [...features.map(feature => feature.type), ...index.operation.parameters.map(parameter => parameter.type),
    ...(index.operation.returnType ? [index.operation.returnType.type] : []), ...index.operation.serviceState.filter(state => ids.has(state.id)).map(state => state.type)];
  const enumerations = index.enumerations.filter(enumeration => enumeration.declarations.some(declaration => ids.has(declaration.elementId)) || visibleTypes.some(type => typeName(type) === enumeration.name));
  const coverage = {signatureCovered: [...parameterIds].every(id => ids.has(id)) && (!index.operation.returnType || ids.has(index.operation.returnType.id)),
    ownerDeclarationsCovered: features.every(feature => ids.has(index.entities.find(entity => entity.name === feature.owner)!.id)),
    namedTypeClosure: features.every(feature => !typeName(feature.type) || !index.entities.some(entity => entity.name === typeName(feature.type)) || ids.has(index.entities.find(entity => entity.name === typeName(feature.type))!.id)),
    explicitEntityMentionsCovered: roots.every(entity => ids.has(entity.id)),
    unresolvedTaskIds: unresolvedTasks.map(task => task.id), proofScope: 'Signature, explicit anchors and model type/navigation closure; not general NL sufficiency'};
  if (!coverage.signatureCovered || !coverage.ownerDeclarationsCovered || !coverage.namedTypeClosure) throw new Error('Model selection closure failed');
  if (ccHash(context) !== before) throw new Error('Authority model was modified');
  return {version: 'operation-relevant-model-v1' as const, modelHash: before, relationPlanHash: R?.hash ?? null, fallback, fallbackReasons: [...new Set(fallbackReasons)],
    fullDeclarations: full, selectedDeclarations: declarations, omittedDeclarations: full.filter(declaration => !ids.has(declaration.id)),
    selectionReasons: declarations.map(declaration => ({id: declaration.id, reasons: [...(reasons.get(declaration.id) ?? [])], source: declaration.source})),
    recalledHintsNotSelected: plan.tasks.flatMap(task => task.modelHints.filter(hint => !ids.has(hint.id)).map(hint => ({taskId: task.id, ...hint, reason: 'Lexical recall is not an owner/path proof'}))),
    modelPaths, coverage,
    inputView: {declarations: declarations.map(({id, declaration}) => {
      const feature = features.find(feature => feature.id === id);
      return {id, declaration, ...(feature ? {kind: feature.kind, ...(feature.associationType ? {associationType: feature.associationType} : {})} : {})};
    }),
      inheritance: index.entities.filter(entity => ids.has(entity.id) && entity.base).map(entity => ({name: entity.name, base: entity.base})),
      enumerations, environment: index.environment}};
}
