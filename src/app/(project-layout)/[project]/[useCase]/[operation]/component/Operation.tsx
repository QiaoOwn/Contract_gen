'use client';
import {FC, useRef} from 'react';
import {Button, Skeleton, Splitter, Tabs} from 'antd';
import {RetweetOutlined} from '@ant-design/icons';
import {useRequest} from 'ahooks';
import request from '@/app/request';
import {ContractSeparator} from '@/app/ContractSeparator';
import './Operation.css';
import OCLGenerator from './OCLGenerator';
import {useGeneratorParams} from '../hook';
import {Provider} from '../context';
import {LoadableContractEditor, LoadableTypescriptEditor} from './LoadableEditor';
import {ContractEditorRef} from './ContractEditor';
export type OperationProps = {
  contract: string;
  typescript: {
    entity: string;
    service: string;
    standardOPs: string;
    dayjs: string;
    jest: string;
    logicFormulaBuilder: string;
    preconditionError: string;
    arrayExtension: string;
    test: string;
  };
  fileKey: string;
  context: string;
  src: string;
  operationDescription: string;
};
const Operation: FC<OperationProps> = ({
  contract,
  typescript,
  fileKey,
  context,
  src,
  operationDescription,
}) => {
  const {
    project,
    useCase,
    operation,
    entityPath,
    standardOPsPath,
    logicFormulaBuilderPath,
    preconditionErrorPath,
    arrayExtensionPath,
    testPath,
    servicePath,
    dayjsPath,
  } = useGeneratorParams();
  const contractEditorRef = useRef<ContractEditorRef>(null);
  const {runAsync, loading, data} = useRequest(
    () =>
      request.post('/transform-to-ts', {
        project,
        useCase,
        operation,
        contract: new ContractSeparator().separate(
          contractEditorRef.current?.editor!.getModel()?.getValue() || ''
        ),
      }),
    {manual: true}
  );
  const commonLibs = [
    {content: typescript.entity, filePath: entityPath},
    {content: typescript.standardOPs, filePath: standardOPsPath},
    {
      content: typescript.logicFormulaBuilder,
      filePath: logicFormulaBuilderPath,
    },
    {
      content: typescript.arrayExtension,
      filePath: arrayExtensionPath,
    },
    {
      content: typescript.preconditionError,
      filePath: preconditionErrorPath,
    },
    {
      content: typescript.dayjs,
      filePath: dayjsPath,
    },
  ];

  return (
    <Provider value={{commonLibs}}>
      <div className="operation-shell">
        <Splitter lazy className="operation-splitter" layout={'vertical'}>
          <Splitter.Panel collapsible>
            <Splitter layout={'horizontal'}>
              <Splitter.Panel defaultSize="46%" min="28%" max="72%">
                <div className="operation-panel">
                  <Tabs
                    className="operation-tabs"
                    style={{height: '100%'}}
                    type="card"
                    tabBarExtraContent={
                      <Button
                        className="operation-action-button"
                        type="primary"
                        size="small"
                        icon={<RetweetOutlined />}
                        onClick={runAsync}
                        loading={loading}
                      >
                        Transform
                      </Button>
                    }
                    items={[
                      {
                        label: 'Contract',
                        key: 'contract',
                        children: (
                          <LoadableContractEditor ref={contractEditorRef} code={contract} />
                        ),
                      },
                      {
                        label: 'Context',
                        key: 'context',
                        children: <pre style={{height: '100%', overflow: 'auto'}}>{context}</pre>,
                      },
                    ]}
                  />
                </div>
              </Splitter.Panel>
              <Splitter.Panel>
                <div className="operation-panel">
                  <Tabs
                    className="operation-tabs"
                    style={{height: '100%'}}
                    type="card"
                    items={[
                      {
                        destroyOnHidden: true,
                        label: 'Service',
                        key: 'service',
                        children: (
                          <Skeleton loading={loading} active paragraph={{rows: 5}}>
                            <LoadableTypescriptEditor
                              code={data?.data?.code || typescript.service}
                              path={servicePath}
                              libs={commonLibs}
                            />
                          </Skeleton>
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'Entity',
                        key: 'entity',
                        children: (
                          <LoadableTypescriptEditor
                            path={entityPath}
                            code={typescript.entity}
                            libs={[
                              {
                                content: typescript.dayjs,
                                filePath: dayjsPath,
                              },
                            ]}
                          />
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'StandardOPs',
                        key: 'standardOPs',
                        children: (
                          <LoadableTypescriptEditor
                            path={standardOPsPath}
                            code={typescript.standardOPs}
                          />
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'ArrayExtension',
                        key: 'arrayExtension',
                        children: (
                          <LoadableTypescriptEditor
                            path={arrayExtensionPath}
                            code={typescript.arrayExtension}
                          />
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'LogicFormulaBuilder',
                        key: 'logicFormulaBuilder',
                        children: (
                          <LoadableTypescriptEditor
                            path={logicFormulaBuilderPath}
                            code={typescript.logicFormulaBuilder}
                          />
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'PreconditionError',
                        key: 'preconditionError',
                        children: (
                          <LoadableTypescriptEditor
                            path={preconditionErrorPath}
                            code={typescript.preconditionError}
                          />
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'dayjs',
                        key: 'dayjs',
                        children: (
                          <LoadableTypescriptEditor path={dayjsPath} code={typescript.dayjs} />
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'Test',
                        key: 'test',
                        children: (
                          <LoadableTypescriptEditor
                            path={testPath}
                            code={typescript.test}
                            libs={[
                              ...commonLibs,
                              {
                                content: typescript.service,
                                filePath: preconditionErrorPath,
                              },
                              {
                                content: typescript.jest,
                                filePath: 'jest.d.ts',
                              },
                            ]}
                          />
                        ),
                      },
                      {
                        destroyOnHidden: true,
                        label: 'Test Coverage',
                        key: 'test-coverage',
                        children: (
                          <iframe
                            className="w-full"
                            style={{height: `calc(100vh - 40px)`}}
                            src={`/coverage/lcov-report/test/${fileKey}/index.html`}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
          <Splitter.Panel className="relative" collapsible>
            <OCLGenerator src={src} initialUserInput={operationDescription} />
          </Splitter.Panel>
        </Splitter>
      </div>
    </Provider>
  );
};
export default Operation;
