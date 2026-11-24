import {GenerateOCLResult} from '@/app/service/generateOCL';

export function buildRunLogFilename(basename: string, runIndex: number): string {
  const safe = basename.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_');
  return `${safe || 'pipeline'}-run-${runIndex + 1}.json`;
}

export function downloadRunLogsJson(processes: GenerateOCLResult[], filename: string): void {
  const blob = new Blob([JSON.stringify(processes, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
