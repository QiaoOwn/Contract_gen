'use client';
import {GenerateOCLResult} from '@/app/service/generateOCL';
import {useRequest} from 'ahooks';
import {
  Button,
  Space,
  Splitter,
  Image,
  Steps,
  StepProps,
  App,
  FloatButton,
  Tabs,
  Select,
  Input,
  Typography,
  Collapse,
  Tag,
} from 'antd';
import {LoadingOutlined, FileOutlined, RedoOutlined} from '@ant-design/icons';
import {FC, useMemo, useState} from 'react';
import {useGeneratorParams} from '../hook';
import {useOperationContext} from '../context';
import {LoadableContractEditor, LoadableTypescriptEditor} from './LoadableEditor';
import LogDrawer from './LogDrawer';
import TestResult from './TestResult';
import {OpenAIChatModelId} from '@langchain/openai';
import {defaultModel, models} from '@/app/constant';
import {LoadableJsonView} from './LoadableJsonView';
enum Status {
  NotStarted,
  Process,
  Finish,
}
const OCLGenerator: FC<{src: string; initialUserInput?: string}> = ({initialUserInput}) => {
  const {Text} = Typography;
  const {TextArea} = Input;
  const {message} = App.useApp();
  const {project, useCase, operation, servicePath} = useGeneratorParams();
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [processes, setProcesses] = useState<GenerateOCLResult[]>([]);
  const [logs, setLogs] = useState<GenerateOCLResult[][]>([]);
  const [status, setStatus] = useState<Status>(Status.NotStarted);
  const {commonLibs} = useOperationContext();
  const [model, setModel] = useState<OpenAIChatModelId>(defaultModel);
  const [userInput, setUserInput] = useState(initialUserInput || '');
  const modelOptions = useMemo(
    () =>
      Array.from(new Set(models)).map((modelOption) => ({
        value: modelOption,
        label: modelOption,
      })),
    []
  );
  const {loading: generateOCLLoading, runAsync: generateOCL} = useRequest(
    () =>
      fetch('/api/generate-ocl', {
        body: JSON.stringify({project, useCase, operation, model, userInput}),
        method: 'POST',
      }),
    {
      manual: true,
      onSuccess: async (data) => {
        const acc: GenerateOCLResult[] = [];
        try {
          const reader = data.body?.getReader();
          if (reader) {
            setStatus(Status.Process);
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
              const {done, value} = await reader.read();
              buffer += decoder.decode(value ?? new Uint8Array(), {stream: !done});
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) {
                  continue;
                }
                const step = JSON.parse(trimmed) as GenerateOCLResult;
                acc.push(step);
                setProcesses([...acc]);
              }
              if (done) {
                const tail = buffer.trim();
                if (tail) {
                  acc.push(JSON.parse(tail) as GenerateOCLResult);
                  setProcesses([...acc]);
                }
                setLogs((logs) => [...logs, acc]);
                setStatus(Status.Finish);
                break;
              }
            }
          }
        } catch (error) {
          setLogs((logs) => [...logs, acc]);
          setProcesses([]);
          setStatus(Status.NotStarted);
          message.error(`Generate OCL failed: ${(error as Error).message}`);
        }
      },
    }
  );
  console.log(processes);

  const isFinished = status === Status.Finish;
  // Use a fixed landing image so UI preview is decoupled from runtime graph rendering.
  const landingImageSrc = '/Overall.png';
  const lastStep = isFinished ? processes.at(-1)!['Test Result'] : undefined;
  const buildStepStatus = (item: Record<string, unknown>, isLast: boolean): StepProps['status'] => {
    if (item.typescriptErrors || item.contractErrors) {
      const hasTypescriptError =
        Array.isArray(item.typescriptErrors) && item.typescriptErrors.length > 0;
      const hasContractError = Array.isArray(item.contractErrors) && item.contractErrors.length > 0;
      if (hasTypescriptError || hasContractError) {
        return 'error';
      }
    }
    if (!isFinished && isLast) {
      return 'process';
    }
    return 'finish';
  };
  return (
    <>
      {isFinished && (
        <FloatButton
          onClick={() => {
            setProcesses([]);
            setStatus(Status.NotStarted);
          }}
          tooltip={'Reset'}
          icon={<RedoOutlined />}
          type="primary"
        />
      )}
      {logs.length > 0 && (
        <FloatButton
          style={{insetBlockEnd: 108}}
          onClick={() => setLogDrawerOpen(true)}
          icon={<FileOutlined />}
          type="primary"
          tooltip={'Logs'}
        />
      )}
      <LogDrawer open={logDrawerOpen} onClose={() => setLogDrawerOpen(false)} logs={logs} />
      <div className="generator-shell">
        {processes.length === 0 ? (
          <>
            <div className="generator-toolbar">
              <Select
                style={{width: 150}}
                value={model}
                onChange={(value) => setModel(value as OpenAIChatModelId)}
                options={modelOptions}
                virtual={false}
                listHeight={320}
                popupMatchSelectWidth={false}
                getPopupContainer={(triggerNode) => triggerNode.parentElement ?? document.body}
              />
            </div>
            <div
              className="absolute"
              style={{top: `50%`, left: `50%`, transform: `translate(-50%,-50%)`}}
            >
              <Space direction="vertical" size="middle" className="items-center generator-landing">
                <div style={{width: 700, maxWidth: '80vw'}}>
                  <Text>Natural language input</Text>
                  <TextArea
                    value={userInput}
                    onChange={(event) => setUserInput(event.target.value)}
                    rows={5}
                    placeholder="Describe operation behavior in natural language"
                  />
                </div>
                <Image alt="" height={300} src={landingImageSrc} preview={false} />
                <Button
                  loading={generateOCLLoading}
                  type="primary"
                  onClick={generateOCL}
                  size="large"
                  disabled={!userInput.trim()}
                >
                  Generate OCL For {project} {useCase} {operation}
                </Button>
              </Space>
            </div>
          </>
        ) : status === Status.Process ? (
          <div
            className="absolute"
            style={{top: `50%`, left: `50%`, transform: `translate(-50%,-50%)`}}
          >
            <div className="generator-steps">
              <Steps
                items={processes.map((process) => {
                  const key = Object.keys(process)[0] as keyof GenerateOCLResult;
                  const item = process[key];
                  const isLast = processes.at(-1) === process;
                  const s = buildStepStatus(item as Record<string, unknown>, isLast);
                  return {
                    title: key,
                    status: s!,
                    icon: s === 'process' ? <LoadingOutlined /> : undefined,
                  };
                })}
              />
            </div>
          </div>
        ) : (
          <Splitter layout={'horizontal'}>
            <Splitter.Panel>
              <Tabs
                className="operation"
                type="card"
                items={[
                  {
                    key: 'natural_language_input',
                    label: 'Natural Language Input',
                    children: <pre className="generator-input-preview">{userInput}</pre>,
                  },
                  {
                    key: 'contract_generated',
                    label: 'Contract Generated',
                    children: <LoadableContractEditor code={lastStep!.contract!} />,
                  },
                  {
                    key: 'pipeline_steps',
                    label: 'Pipeline Steps',
                    children: (
                      <div className="generator-step-details">
                        <Collapse
                          defaultActiveKey={processes.map((_, index) => `${index}`)}
                          items={processes.map((process, index) => {
                            const stepName = Object.keys(process)[0] as keyof GenerateOCLResult;
                            const stepData = process[stepName] as Record<string, unknown>;
                            const stepStatus = buildStepStatus(
                              stepData,
                              index === processes.length - 1
                            );
                            return {
                              key: `${index}`,
                              label: (
                                <div className="generator-step-header">
                                  <span>{`${index + 1}. ${stepName}`}</span>
                                  <Tag color={stepStatus === 'error' ? 'red' : 'blue'}>
                                    {stepStatus === 'error' ? 'Error' : 'Done'}
                                  </Tag>
                                </div>
                              ),
                              children: (
                                <div className="generator-step-content">
                                  {stepData.contract ? (
                                    <pre className="generator-input-preview">
                                      {stepData.contract as string}
                                    </pre>
                                  ) : null}
                                  <LoadableJsonView src={stepData} />
                                </div>
                              ),
                            };
                          })}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Splitter.Panel>
            <Splitter.Panel>
              <Tabs
                className="operation"
                type="card"
                items={[
                  {
                    key: 'typescript_generated',
                    label: 'TypeScript Generated',
                    children: (
                      <LoadableTypescriptEditor
                        path={`generated/${servicePath}`}
                        libs={commonLibs}
                        code={lastStep!.typescript!.service}
                      />
                    ),
                  },
                  {
                    key: 'test_result',
                    label: 'Test Result',
                    children: (
                      <TestResult summary={lastStep!.summary!} result={lastStep!.result!} />
                    ),
                  },
                ]}
              />
            </Splitter.Panel>
          </Splitter>
        )}
      </div>
    </>
  );
};
export default OCLGenerator;
