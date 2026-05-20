import t from '@babel/types';
import {ProjectParam} from '../type';

export type GetOperationCodeParams = ProjectParam & {
  operation: string;
  removeExports?: boolean;
};

export function removeFileExportsAndImports(file: t.File) {
  file.program.body = file.program.body
    .map((node) => {
      if (node.type.includes('Export')) {
        return null;
      }
      if (node.type.includes('Import')) {
        return null;
      }
      return node;
    })
    .filter(Boolean) as t.Statement[];
  return file;
}
