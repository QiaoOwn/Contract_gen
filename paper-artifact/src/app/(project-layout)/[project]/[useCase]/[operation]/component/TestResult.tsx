import {FC, useState} from 'react';
import type {CoverageSummary} from 'istanbul-lib-coverage';
import type {TestResult} from '@jest/test-result';
import {Button, Descriptions, List, Modal} from 'antd';

const getFailureMessage = (detail: unknown): string => {
  if (typeof detail === 'string') {
    return detail;
  }
  if (detail instanceof Error) {
    return detail.stack || detail.message;
  }
  if (detail && typeof detail === 'object') {
    const withMatcherResult = detail as {matcherResult?: {message?: string}};
    if (withMatcherResult.matcherResult?.message) {
      return withMatcherResult.matcherResult.message;
    }
    const withMessage = detail as {message?: string; stack?: string};
    if (withMessage.message) {
      return withMessage.stack || withMessage.message;
    }
  }
  return String(detail ?? 'Unknown test failure detail');
};

export type TestResultProps = {
  result: TestResult;
  summary: CoverageSummary;
};
const TestResult: FC<TestResultProps> = ({result, summary}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-4">
      <Modal open={open} footer={null} onCancel={() => setOpen(false)}>
        <List
          dataSource={result.testResults}
          renderItem={(item) => {
            return (
              <>
                <List.Item>
                  <List.Item.Meta
                    title={item.fullName}
                    description={
                      <List
                        dataSource={item.failureDetails ?? []}
                        renderItem={(e) => (
                          <pre className="m-0 whitespace-pre-wrap">{getFailureMessage(e)}</pre>
                        )}
                      />
                    }
                  />
                </List.Item>
              </>
            );
          }}
        />
      </Modal>
      <Descriptions
        title="Test Result"
        bordered
        items={[
          {key: 'numFailingTests', label: 'Failing Count', children: result.numFailingTests},
          {key: 'numPassingTests', label: 'Passing Count', children: result.numPassingTests},
          {
            key: 'testResults',
            label: 'Test Results',
            children: <Button onClick={() => setOpen(true)}>Open Result Modal</Button>,
          },
        ]}
      />
      <Descriptions
        title="Test Coverage"
        bordered
        items={[
          {key: 'lines', label: 'Lines', children: `${summary.lines.pct}%`},
          {key: 'statements', label: 'Statements', children: `${summary.statements.pct}%`},
          {key: 'functions', label: 'Functions', children: `${summary.functions.pct}%`},
          {key: 'branches', label: 'Branches', children: `${summary.branches.pct}%`},
        ]}
      />
    </div>
  );
};
export default TestResult;
