'use client';

import {GenerateOCLResult} from '@/app/service/generateOCL';
import {
  Alert,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Modal,
  type ModalProps,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {FC, useEffect, useMemo, useState} from 'react';

const PIPELINE_ORDER = [
  'OCL Generator',
  'Contract Generator',
  'TypeScript Generator',
  'TypeScript Parser',
  'Test Result',
] as const;

type PipelineStepKey = (typeof PIPELINE_ORDER)[number];

function mergeLatestByStep(steps: GenerateOCLResult[]): Partial<Record<PipelineStepKey, unknown>> {
  const acc: Partial<Record<PipelineStepKey, unknown>> = {};
  const order = PIPELINE_ORDER as readonly string[];
  for (const step of steps) {
    for (const k of Object.keys(step) as Array<keyof GenerateOCLResult>) {
      if (order.includes(k)) {
        const v = step[k];
        if (v != null) {
          acc[k as PipelineStepKey] = v;
        }
      }
    }
  }
  return acc;
}

const TS_FILE_KEYS = ['entry', 'entity', 'service', 'originalEntity', 'originalService'] as const;

const TS_FILE_LABELS: Record<(typeof TS_FILE_KEYS)[number], string> = {
  entry: 'Entry',
  entity: 'Entity',
  service: 'Service',
  originalEntity: 'Original entity',
  originalService: 'Original service',
};

const CodeBlock: FC<{title: string; code: string}> = ({title, code}) => (
  <Card
    size="small"
    title={title}
    extra={<Typography.Text copyable={{text: code}} />}
    styles={{body: {padding: 0}}}
  >
    <pre
      style={{
        margin: 0,
        padding: 12,
        maxHeight: 420,
        overflow: 'auto',
        fontSize: 12,
        lineHeight: 1.5,
        background: '#f6f8fa',
        color: '#24292f',
        borderRadius: '0 0 8px 8px',
        borderTop: '1px solid #d0d7de',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      <code>{code}</code>
    </pre>
  </Card>
);

const ErrorsBlock: FC<{errors: unknown[]}> = ({errors}) => (
  <Space direction="vertical" style={{width: '100%'}} size="small">
    {errors.map((e, i) => (
      <Alert
        key={i}
        type="error"
        showIcon
        message={typeof e === 'string' ? e : JSON.stringify(e, null, 2)}
      />
    ))}
  </Space>
);

const TypeScriptStagePanel: FC<{payload: Record<string, unknown>}> = ({payload}) => {
  const errors = payload.typescriptErrors as unknown[] | undefined;
  const typescript = payload.typescript as Record<string, unknown> | undefined;

  if (errors?.length) {
    return <ErrorsBlock errors={errors} />;
  }
  if (!typescript) {
    return <Empty description="No TypeScript snapshot" />;
  }

  const tabs = TS_FILE_KEYS.filter((k) => typeof typescript[k] === 'string');
  if (tabs.length === 0) {
    return <Empty description="No TS source strings in this snapshot" />;
  }

  return (
    <Tabs
      type="card"
      items={tabs.map((k) => ({
        key: k,
        label: TS_FILE_LABELS[k],
        children: <CodeBlock title={TS_FILE_LABELS[k]} code={typescript[k] as string} />,
      }))}
    />
  );
};

const StepPanel: FC<{stepKey: PipelineStepKey; data: unknown}> = ({stepKey, data}) => {
  if (data == null) {
    return <Empty />;
  }

  switch (stepKey) {
    case 'OCL Generator': {
      const d = data as {
        ocl?: {definition?: string; precondition?: string; postcondition?: string};
        userInput?: string;
      };
      return (
        <Space direction="vertical" style={{width: '100%'}} size="middle">
          {d.ocl?.definition != null && <CodeBlock title="Definition" code={d.ocl.definition} />}
          {d.ocl?.precondition != null && (
            <CodeBlock title="Precondition" code={d.ocl.precondition} />
          )}
          {d.ocl?.postcondition != null && (
            <CodeBlock title="Postcondition" code={d.ocl.postcondition} />
          )}
          {d.userInput != null && d.userInput !== '' && (
            <CodeBlock title="User input" code={d.userInput} />
          )}
        </Space>
      );
    }
    case 'Contract Generator': {
      const d = data as {contract?: string; contractErrors?: unknown[]};
      return (
        <Space direction="vertical" style={{width: '100%'}} size="middle">
          {d.contractErrors?.length ? <ErrorsBlock errors={d.contractErrors} /> : null}
          {d.contract != null && d.contract !== '' ? (
            <CodeBlock title="Contract" code={d.contract} />
          ) : (
            !d.contractErrors?.length && <Empty description="No contract text" />
          )}
        </Space>
      );
    }
    case 'TypeScript Generator':
    case 'TypeScript Parser':
      return <TypeScriptStagePanel payload={data as Record<string, unknown>} />;
    case 'Test Result': {
      const d = data as {
        result?: {
          numPassingTests?: number;
          numFailingTests?: number;
          numPendingTests?: number;
          numTodoTests?: number;
        };
        contract?: string;
        summary?: unknown;
      };
      const r = d.result;
      const total =
        (r?.numPassingTests ?? 0) +
        (r?.numFailingTests ?? 0) +
        (r?.numPendingTests ?? 0) +
        (r?.numTodoTests ?? 0);
      return (
        <Space direction="vertical" style={{width: '100%'}} size="middle">
          {r && (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Passing">{r.numPassingTests ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Failing">{r.numFailingTests ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Pending">{r.numPendingTests ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Todo">{r.numTodoTests ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Total (sum)" span={2}>
                {total}
              </Descriptions.Item>
            </Descriptions>
          )}
          {d.contract != null && d.contract !== '' && (
            <CodeBlock title="Contract (at test run)" code={d.contract} />
          )}
          <Collapse
            size="small"
            items={[
              {
                key: 'jest',
                label: 'Jest result (JSON)',
                children: (
                  <CodeBlock title="result" code={JSON.stringify(d.result ?? {}, null, 2)} />
                ),
              },
              {
                key: 'coverage',
                label: 'Coverage summary (JSON)',
                children: (
                  <CodeBlock title="summary" code={JSON.stringify(d.summary ?? {}, null, 2)} />
                ),
              },
            ]}
          />
        </Space>
      );
    }
    default:
      return <Empty />;
  }
};

export type LogModalProps = {
  steps: GenerateOCLResult[];
  initialTab?: string;
} & Omit<ModalProps, 'children'>;

const LogModal: FC<LogModalProps> = ({steps, initialTab, ...modalProps}) => {
  const merged = useMemo(() => mergeLatestByStep(steps), [steps]);
  const [active, setActive] = useState<PipelineStepKey>(PIPELINE_ORDER[0]);

  useEffect(() => {
    if (!modalProps.open) {
      return;
    }
    const preferred =
      initialTab &&
      (PIPELINE_ORDER as readonly string[]).includes(initialTab) &&
      merged[initialTab as PipelineStepKey]
        ? (initialTab as PipelineStepKey)
        : undefined;
    const firstWithData = PIPELINE_ORDER.find((k) => merged[k] != null);
    setActive(preferred ?? firstWithData ?? PIPELINE_ORDER[0]);
  }, [modalProps.open, initialTab, merged]);

  const tabItems = useMemo(
    () =>
      PIPELINE_ORDER.map((key) => {
        const hasData = merged[key] != null;
        return {
          key,
          label: (
            <span>
              {key}
              {!hasData ? <Tag style={{marginLeft: 6}}>—</Tag> : null}
            </span>
          ),
          disabled: !hasData,
          children: <StepPanel stepKey={key} data={merged[key]} />,
        };
      }),
    [merged]
  );

  return (
    <Modal
      {...modalProps}
      centered
      width={1120}
      footer={null}
      title="Pipeline artifacts"
      styles={{body: {maxHeight: '85vh', overflow: 'auto', paddingTop: 12}}}
    >
      <Typography.Paragraph type="secondary" style={{marginTop: 0}}>
        Each tab shows the latest snapshot for that stage in this run. Under TypeScript stages, use
        the sub-tabs to view one generated file at a time (suitable for figures).
      </Typography.Paragraph>
      {!steps.length ? (
        <Empty description="No steps in this run" />
      ) : (
        <Tabs
          activeKey={active}
          onChange={(k) => setActive(k as PipelineStepKey)}
          items={tabItems}
        />
      )}
    </Modal>
  );
};

export default LogModal;
