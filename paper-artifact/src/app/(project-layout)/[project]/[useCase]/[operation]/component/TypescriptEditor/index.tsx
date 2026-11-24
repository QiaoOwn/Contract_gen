'use client';
import {FC, useRef, useState} from 'react';
import type {Monaco} from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
// @ts-expect-error no type here
import {language as defaultTypescriptLanguage} from 'monaco-editor/esm/vs/basic-languages/typescript/typescript';
import {LoadableMonacoEditor} from '../LoadableEditor';
export type TypescriptEditorProps = {
  code: string;
  path: string;
  libs?: {content: string; filePath: string}[];
};
const TypescriptEditor: FC<TypescriptEditorProps> = ({code, path, libs = []}) => {
  const [typescriptCode, setTypescriptCode] = useState<string>(code);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);
  const monacoRef = useRef<Monaco>(null);
  return (
    <LoadableMonacoEditor
      height={'50vh'}
      onChange={(value) => {
        const code = value || '';
        setTypescriptCode(code);
      }}
      defaultValue={typescriptCode}
      defaultPath={path}
      beforeMount={async (monaco) => {
        monaco.editor.defineTheme('myCustomTheme', {
          base: 'vs', // 或 'vs-dark'、'hc-black'
          inherit: true,
          rules: [
            // 修改注释颜色
            {token: 'comment', foreground: '#950caadc', fontStyle: 'italic'},
          ],
          colors: {
            // 可选：修改其他全局颜色（如背景、文字等）
          },
        });
        // 设置 Monarch 语法高亮配置
        monaco.languages.setMonarchTokensProvider('typescript', {
          ...defaultTypescriptLanguage,
          keywords: [...defaultTypescriptLanguage.keywords, 'and', 'or', 'then', 'else'],
          tokenizer: {
            ...defaultTypescriptLanguage.tokenizer,
            root: [
              // 高亮 .and 方法
              [/(\.)(and)/, ['operator', 'keyword']],
              ...defaultTypescriptLanguage.tokenizer.root,
            ],
          },
        });
        // compiler options
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2016,
          allowNonTsExtensions: true,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.CommonJS,
          noEmit: true,
          typeRoots: ['node_modules/@types'],
        });
        monaco.languages.typescript.typescriptDefaults.setExtraLibs(libs);
      }}
      theme={'myCustomTheme'}
      defaultLanguage="typescript"
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
      }}
    />
  );
};
export default TypescriptEditor;
