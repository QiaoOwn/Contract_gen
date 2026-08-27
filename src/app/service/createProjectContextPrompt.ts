import {UseCase} from '@/rm2pt/model/UseCase';
import * as project from '@/rm2pt/project';
import {ProjectParam} from '../type';
import {Entity} from '@/rm2pt/model/Entity';
export type CreateProjectContextPromptParam = ProjectParam;

export const OCL_ENVIRONMENT_CONTEXT = [
  'Environment Values (read-only; captured once per operation invocation)',
  '  1.Today: Date',
  '    Description: The calendar day at operation entry, normalized to the start of that day.',
  '  2.Now: Date',
  '    Description: The date-time instant captured at operation entry.',
].join('\n');

const padLevel = (level: number) => (s: string) => s.padStart(s.length + level * 2, ' ');
export const createProjectContextPrompt = (param: CreateProjectContextPromptParam) => {
  const {project: key, useCase: uc} = param;
  const p = project[key];
  const entity = p.entity;
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  return [
    `Here is the given \`Context\` about the system`,
    padLevel(1)(`Use Case`),
    padLevel(2)(`Name: ${useCase.name}`),
    padLevel(2)(`Description: ${useCase.description}`),
    padLevel(2)(`Service:`),
    padLevel(2)(`Name: ${service.name}`),
    service.tempVariables?.length
      ? padLevel(2)(`Temporary Variables (service state; access as self.<name>):`)
      : undefined,
    ...(service.tempVariables || [])?.map((e, i) => padLevel(3)(`${i + 1}.${e.name}: ${e.type}`)),
    OCL_ENVIRONMENT_CONTEXT,
    padLevel(1)(`Entities`),
    createEntitiesPrompt(Object.values(entity)),
  ]
    .filter(Boolean)
    .join('\n');
};

const createEntitiesPrompt = (entities: Entity[]) => {
  return entities
    .map((e) =>
      [
        padLevel(2)(`Name: ${e.name}`),
        padLevel(3)(`Description: ${e.description}`),
        e.extends ? padLevel(3)(`Extends: ${e.extends.name}`) : undefined,
        padLevel(3)(`Attributes`),
        e.attributes
          .map((a, i) =>
            [
              padLevel(4)(`${i + 1}.Name: ${a.name}`),
              padLevel(5)(`Type: ${a.type}`),
              padLevel(5)(`Description: ${a.description}`),
            ].join('\n')
          )
          .join('\n'),
        e.relationships?.length ? padLevel(3)(`Relationships`) : undefined,
        (e.relationships || [])
          .map((r, i) =>
            [
              padLevel(4)(`${i + 1}.Name: ${r.name}`),
              padLevel(5)(`Type: ${r.relatedEntity}`),
              padLevel(5)(`Association Type: ${r.associationType}`),
              padLevel(5)(`Description: ${r.description}`),
            ].join('\n')
          )
          .join('\n'),
      ].join('\n')
    )
    .filter(Boolean)
    .join('\n');
};
