import dynamic from 'next/dynamic';
import type {EditorProps} from '@monaco-editor/react';
import {TypescriptEditorProps} from './TypescriptEditor';
import {ContractEditorProps, ContractEditorRef} from './ContractEditor';
import {Ref} from 'react';
export const LoadableMonacoEditor = dynamic<EditorProps>(() => import('@monaco-editor/react'), {
  ssr: false,
});

export const LoadableTypescriptEditor = dynamic<TypescriptEditorProps>(
  () => import('./TypescriptEditor'),
  {
    ssr: false,
  }
);

export const LoadableContractEditor = dynamic<ContractEditorProps & {ref?: Ref<ContractEditorRef>}>(
  () => import('./ContractEditor'),
  {
    ssr: false,
  }
);
