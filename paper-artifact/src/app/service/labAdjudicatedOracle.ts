import * as babel from '@babel/core';
// @ts-expect-error no types for this package
import presetTypescript from '@babel/preset-typescript';
import generate from '@babel/generator';
import fs from 'fs-extra';
import path from 'path';
import {createHash} from 'node:crypto';

export type OracleProfile = 'historical' | 'lab-adjudicated-114-v1' | 'rm2pt-authoritative-preparation' | 'rm2pt-authoritative-preparation-v2' | 'rm2pt-authoritative-preparation-v3' | 'rm2pt-authoritative-preparation-v4';

type OracleMapRow = {
  id: string;
  historical_jest: string;
  boundary_jest: string | null;
};

function mappedOracle(profile: OracleProfile | undefined, project: string, useCase: string, operation: string): OracleMapRow | null {
  if (profile === 'historical') return null;
  if (profile === 'rm2pt-authoritative-preparation' || profile === 'rm2pt-authoritative-preparation-v2' || profile === 'rm2pt-authoritative-preparation-v3' || profile === 'rm2pt-authoritative-preparation-v4') {
    const version = profile === 'rm2pt-authoritative-preparation-v4' ? 'rm2pt_authoritative_114_v4' : profile === 'rm2pt-authoritative-preparation-v3' ? 'rm2pt_authoritative_114_v3' : profile === 'rm2pt-authoritative-preparation-v2' ? 'rm2pt_authoritative_114_v2' : 'rm2pt_authoritative_114';
    const base = path.resolve(process.cwd(), `data/benchmark/${version}`);
    const manifest = fs.readJSONSync(path.join(base, 'oracles/manifest.json'));
    const hash = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    const prepared = fs.readJSONSync(path.join(base, 'manifest.json'));
    if (manifest.version !== (version.endsWith('_v4') ? 'rm2pt-authoritative-oracle-preparation-v4' : version.endsWith('_v3') ? 'rm2pt-authoritative-oracle-preparation-v3' : version.endsWith('_v2')
          ? 'rm2pt-authoritative-oracle-preparation-v2' : 'rm2pt-authoritative-oracle-preparation-v1') ||
        manifest.role !== 'preparation-only-not-formal-suite' || manifest.formal_experiment_ready !== false ||
        manifest.input !== `data/benchmark/${version}/operations.jsonl` ||
        hash(manifest.input) !== manifest.input_sha256 || prepared.output_sha256 !== manifest.input_sha256)
      throw new Error('Prepared oracle/input integrity mismatch');
    if (!Array.isArray(manifest.records) || manifest.operation_count !== 114 ||
        manifest.records.length !== manifest.prepared_operation_count ||
        new Set(manifest.records.map((item: OracleMapRow) => item.id)).size !== manifest.records.length)
      throw new Error('Prepared oracle registry integrity mismatch');
    const id = `${project}_${useCase}_${operation}`;
    const record = manifest.records.find((item: OracleMapRow) => item.id === id);
    if (!record) throw new Error(`No source-aligned prepared oracle registered for ${id}; no historical fallback is allowed`);
    const rows = fs.readFileSync(manifest.input, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
    const row = rows.find(item => item.id === id);
    if (!row || row.requirement_hash !== record.requirement_hash || row.context_hash !== record.context_hash ||
        row.rm2pt_authority.source_path !== record.source_path || row.rm2pt_authority.source_sha256 !== record.source_sha256 ||
        hash(record.source_path) !== record.source_sha256)
      throw new Error('Prepared oracle requirement/source integrity mismatch');
    if ((record.decision_file ?? null) !== (row.rm2pt_authority.decision_file ?? null) ||
        (record.decision_sha256 ?? null) !== (row.rm2pt_authority.decision_sha256 ?? null) ||
        (record.decision_file && hash(record.decision_file) !== record.decision_sha256))
      throw new Error('Prepared oracle adjudication integrity mismatch');
    const allowedOraclePaths = profile === 'rm2pt-authoritative-preparation-v4'
      ? ['data/benchmark/rm2pt_authoritative_114/oracles/', 'data/benchmark/rm2pt_authoritative_114_v2/oracles/', 'data/benchmark/rm2pt_authoritative_114_v3/oracles/', 'data/benchmark/rm2pt_authoritative_114_v4/oracles/']
      : profile === 'rm2pt-authoritative-preparation-v3'
      ? ['data/benchmark/rm2pt_authoritative_114/oracles/', 'data/benchmark/rm2pt_authoritative_114_v2/oracles/', 'data/benchmark/rm2pt_authoritative_114_v3/oracles/']
      : profile === 'rm2pt-authoritative-preparation-v2'
      ? ['data/benchmark/rm2pt_authoritative_114/oracles/', 'data/benchmark/rm2pt_authoritative_114_v2/oracles/']
      : ['data/benchmark/rm2pt_authoritative_114/oracles/'];
    if (!allowedOraclePaths.some(prefix => record.historical_jest.startsWith(prefix)) ||
        record.historical_jest.split('/').includes('..') || hash(record.historical_jest) !== record.jest_sha256)
      throw new Error('Prepared oracle source integrity mismatch');
    return record;
  }
  if (profile && profile !== 'lab-adjudicated-114-v1') throw new Error(`Unknown oracle profile: ${profile}`);
  const mapPath = path.resolve(process.cwd(), 'data/benchmark/lab_adjudicated_114_v1/oracle-map.jsonl');
  const rows = fs.readFileSync(mapPath, 'utf-8').trim().split(/\r?\n/).map((line) => JSON.parse(line) as OracleMapRow);
  const id = `${project}_${useCase}_${operation}`;
  const row = rows.find((item) => item.id === id);
  if (!row) throw new Error(`Operation missing from 114-row oracle map: ${id}`);
  return row;
}

export function historicalOraclePath(
  profile: OracleProfile | undefined,
  project: string,
  useCase: string,
  operation: string,
  fallback: string
): string {
  const row = mappedOracle(profile, project, useCase, operation);
  return row ? path.resolve(process.cwd(), row.historical_jest) : fallback;
}

export function boundaryOraclePath(
  profile: OracleProfile | undefined,
  project: string,
  useCase: string,
  operation: string
): string | null {
  const row = mappedOracle(profile, project, useCase, operation);
  return row?.boundary_jest ? path.resolve(process.cwd(), row.boundary_jest) : null;
}

export function writeCandidateBoundaryOracle({
  source,
  output,
  candidateModule,
  serviceName,
}: {
  source: string;
  output: string;
  candidateModule: string;
  serviceName: string;
}): void {
  const ast = babel.parse(fs.readFileSync(source, 'utf-8'), {
    filename: 'boundary.test.ts',
    presets: [presetTypescript],
  })!;
  babel.traverse(ast, {
    enter(node) {
      if (node.isStringLiteral()) {
        if (node.node.value === '../../../test/helpers/contractOracle') {
          node.node.value = '../helpers/contractOracle';
        } else if (
          node.node.value.endsWith('.reference') ||
          (node.node.value.startsWith('../../../test/') && node.node.value.endsWith('/entry'))
        ) {
          node.node.value = candidateModule;
        }
      }
      if (node.isIdentifier({name: serviceName})) {
        node.node.name = `${serviceName}_AutoGenerated`;
      }
    },
  });
  fs.writeFileSync(output, generate(ast).code, 'utf-8');
}
