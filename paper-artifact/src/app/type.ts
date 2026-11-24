import {UseCase} from '@/rm2pt/model/UseCase';
import * as project from '@/rm2pt/project';
type ExtractKeys<T> = T extends Record<string, UseCase> ? keyof T : never;
export type UseCaseKeys = ExtractKeys<(typeof project)[keyof typeof project]['useCase']>;

export type ProjectParam = {
  project: keyof typeof project;
  useCase: UseCaseKeys;
  operation?: string;
};

export type ExtractStreamType<T> = T extends ReadableStream<infer U> ? U : never;
export type ExtractRecordKeys<T> = T extends Record<infer U, unknown> ? U : never;
