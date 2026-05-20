'use client';
import React from 'react';
import '@ant-design/v5-patch-for-react-19';
import {ProgressProvider} from '@bprogress/next/app';
import {App, ConfigProvider} from 'antd';
import zh_CN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
const Registry = ({children}: React.PropsWithChildren) => {
  return (
    <>
      <ProgressProvider height="4px" color={'#ed8733'}>
        <App>
          <ConfigProvider
            locale={zh_CN}
            theme={{
              token: {colorPrimary: '#ed8733'},
            }}
          >
            {children}
          </ConfigProvider>
        </App>
      </ProgressProvider>
    </>
  );
};

export default Registry;
