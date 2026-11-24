import {GenerateOCLResult} from '@/app/service/generateOCL';
import {buildRunLogFilename, downloadRunLogsJson} from '@/app/util/downloadRunLogs';
import {DownloadOutlined} from '@ant-design/icons';
import {Button, Collapse, Drawer, DrawerProps, StepProps, Steps} from 'antd';
import {FC, useState} from 'react';
import LogModal from './LogModal';
export type LogDrawerProps = {
  logs: GenerateOCLResult[][];
  /** Used in downloaded JSON filenames, e.g. Airport-raiseRepair-feedback */
  downloadBasename?: string;
} & DrawerProps;
type ModalState = {steps: GenerateOCLResult[]; initialTab?: string};
const LogDrawer: FC<LogDrawerProps> = ({logs, downloadBasename = 'pipeline', ...props}) => {
  const [modal, setModal] = useState<ModalState | null>(null);
  const lastRunIndex = logs.length - 1;
  const lastRun = lastRunIndex >= 0 ? logs[lastRunIndex] : undefined;

  const handleDownloadRun = (processes: GenerateOCLResult[], runIndex: number) => {
    downloadRunLogsJson(processes, buildRunLogFilename(downloadBasename, runIndex));
  };

  return (
    <>
      {modal && (
        <LogModal
          open
          steps={modal.steps}
          initialTab={modal.initialTab}
          onCancel={() => setModal(null)}
        />
      )}
      <Drawer
        destroyOnHidden
        title="Logs"
        extra={
          lastRun ? (
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadRun(lastRun, lastRunIndex)}
            >
              下载最近一次
            </Button>
          ) : null
        }
        {...props}
      >
        <Collapse
          items={logs.map((processes, i) => {
            return {
              key: i,
              label: (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{`No.${i + 1}`}</span>
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadRun(processes, i);
                    }}
                  >
                    下载
                  </Button>
                </div>
              ),
              children: (
                <Steps
                  direction="vertical"
                  items={processes.map((process) => {
                    const key = Object.keys(process)[0] as keyof GenerateOCLResult;
                    const item = process[key];
                    let s: StepProps['status'] = 'finish';
                    if (item.typescriptErrors?.length || item.contractErrors?.length) {
                      s = 'error';
                    }
                    return {
                      title: (
                        <div
                          role="button"
                          tabIndex={0}
                          style={{cursor: 'pointer'}}
                          onClick={() => setModal({steps: processes, initialTab: key})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setModal({steps: processes, initialTab: key});
                            }
                          }}
                        >
                          {key}
                        </div>
                      ),
                      status: s!,
                    };
                  })}
                />
              ),
            };
          })}
          defaultActiveKey={[logs.length - 1]}
        />
      </Drawer>
    </>
  );
};
export default LogDrawer;
