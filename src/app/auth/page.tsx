'use client';
import {useRequest} from 'ahooks';
import {App, Button} from 'antd';
import Password from 'antd/es/input/Password';
import Compact from 'antd/es/space/Compact';
import {FC, useState} from 'react';
import request from '../request';
import {defaultRoute, openAiApiKeyCookieKey} from '@/constant';
import {SaveInfoResponse} from '../api/save-info/route';
import {useRouter} from '@bprogress/next';
const Page: FC = () => {
  const {message} = App.useApp();
  const [password, setPassword] = useState('');
  const {runAsync, loading} = useRequest(
    (data) => request.post<SaveInfoResponse>('/save-info', data),
    {
      manual: true,
    }
  );
  const router = useRouter();
  return (
    <>
      <div
        style={{
          width: '40%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
        }}
      >
        <Compact style={{width: '100%'}}>
          <Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Please Input Your OpenAI ApiKey"
          />
          <Button
            loading={loading}
            type="primary"
            onClick={async () => {
              if (!password?.trim()) {
                message.warning('Please Input Your OpenAI ApiKey');
                return;
              }
              try {
                const res = await runAsync({
                  [openAiApiKeyCookieKey]: password,
                });
                if (res.data.success) {
                  message.success(res.data.message);
                  router.push(defaultRoute);
                }
              } catch (e) {
                const error = e as {response: {data: {message: string}}};
                if (error.response) {
                  message.error(error.response.data.message);
                }
              }
            }}
          >
            Save
          </Button>
        </Compact>
      </div>
    </>
  );
};
export default Page;
