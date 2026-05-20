import {GenerateOCLResult} from '@/app/service/generateOCL';
import {Collapse, Drawer, DrawerProps, StepProps, Steps} from 'antd';
import {FC, useState} from 'react';
import LogModal from './LogModal';
export type LogDrawerProps = {
  logs: GenerateOCLResult[][];
} & DrawerProps;
type ModalState = {steps: GenerateOCLResult[]; initialTab?: string};
const LogDrawer: FC<LogDrawerProps> = ({logs, ...props}) => {
  const [modal, setModal] = useState<ModalState | null>(null);
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
      <Drawer destroyOnHidden title="Logs" {...props}>
        <Collapse
          items={logs.map((processes, i) => {
            return {
              key: i,
              label: `No.${i + 1}`,
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
