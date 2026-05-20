import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import type {Monaco} from '@monaco-editor/react';
import {formatContract, parse} from '../../../../../util';
import type {editor} from 'monaco-editor';
import {LoadableMonacoEditor} from './LoadableEditor';
export type ContractEditorProps = {
  code: string;
};
export type ContractEditorRef = {editor?: editor.IStandaloneCodeEditor};
const ContractEditor = forwardRef<ContractEditorRef, ContractEditorProps>(({code}, ref) => {
  const [contractCode, setContractCode] = useState<string>(code);
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
  const monacoRef = useRef<Monaco>(null);
  const setModelErrorMarkers = (code: string) => {
    const {errors} = parse(code);
    monacoRef.current!.editor.setModelMarkers(
      editorRef.current!.getModel()!,
      'remodel',
      errors.map((error) => ({
        severity: monacoRef.current!.MarkerSeverity.Error,
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.line,
        endColumn: error.column + 1,
        message: error.msg,
      }))
    );
  };
  useImperativeHandle(ref, () => {
    return {
      editor,
    };
  }, [editor]);
  return (
    <LoadableMonacoEditor
      height={'100vh'}
      onChange={(value) => {
        const code = value || '';
        setContractCode(code);
        setModelErrorMarkers(code);
      }}
      value={contractCode}
      language="remodel"
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        setEditor(editor);
        monacoRef.current = monaco;
        setModelErrorMarkers(editorRef.current.getValue());
      }}
      beforeMount={(monaco: Monaco) => {
        monaco.languages.register({id: 'remodel'});
        // 设置 Monarch 语法高亮配置
        monaco.languages.setMonarchTokensProvider('remodel', {
          keywords: [
            'in',
            'let',
            'and',
            'RequirementsModel',
            'Interaction',
            'CallMessage',
            'ReturnMessage',
            'Execution',
            'CombinedFragment',
            'loop',
            'alt',
            'option',
            'Actor',
            'Service',
            'Contract',
            'Entity',
            'definition',
            'precondition',
            'postcondition',
            'inv',
            'invariant',
            'Set',
            'Bag',
            'Sequence',
            'Collection',
            'OrderedSet',
            'Boolean',
            'Integer',
            'Real',
            'String',
            'UnlimitedNatural',
            'Date',
            'OclAny',
            'OclInvalid',
            'OclVoid',
            'endif',
            'then',
            'if',
            'else',
          ],
          operators: [
            '->',
            '::',
            '>',
            '<',
            '>=',
            '<=',
            '=',
            '<>',
            '*',
            '/',
            '+',
            '-',
            'and',
            'or',
            'not',
            'include',
            'extend',
          ],
          symbols: /[!$%&()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]/,

          tokenizer: {
            root: [
              [
                /[a-zA-Z_]\w*/,
                {
                  cases: {
                    '@keywords': 'keyword',
                    '@default': 'identifier',
                  },
                },
              ],
              [/"([^"\\]|\\.)*$/, 'string.invalid'], // Unfinished string
              [/"/, 'string', '@string_double'],
              [/'([^'\\]|\\.)*$/, 'string.invalid'], // Unfinished string
              [/'/, 'string', '@string_single'],
              [/\d+/, 'number'],
              [/[ \t\r\n]+/, 'white'],
              // 单行注释
              [/\/\/.*$/, 'comment'],
              // 多行注释开始
              [/\/\*/, 'comment', '@comment'],
            ],
            // 多行注释状态
            comment: [
              [/[^\/*]+/, 'comment'],
              // 匹配嵌套注释开头（可选）
              [/\/\*/, 'comment', '@push'],
              // 匹配注释结束
              [/\*\//, 'comment', '@pop'],
              [/[\/*]/, 'comment'],
            ],
            string_double: [
              [/[^\\"]+/, 'string'],
              [/\\./, 'string.escape'],
              [/"/, 'string', '@pop'],
            ],

            string_single: [
              [/[^\\']+/, 'string'],
              [/\\./, 'string.escape'],
              [/'/, 'string', '@pop'],
            ],
          },
        });
        // 格式化器接口实现
        monaco.languages.registerDocumentFormattingEditProvider('remodel', {
          provideDocumentFormattingEdits(model) {
            const inputCode = model.getValue();
            const {errors, tree, tokens} = parse(inputCode);
            if (errors.length > 0) {
              console.error('Syntax errors: ', errors);
              return;
            }
            const formattedCode = formatContract(tree!, tokens);
            return [
              {
                range: model.getFullModelRange(),
                text: formattedCode,
              },
            ];
          },
        });
      }}
    />
  );
});
ContractEditor.displayName = 'ContractEditor';
export default ContractEditor;
