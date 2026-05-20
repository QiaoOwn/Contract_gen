'use client';
import {Layout, Menu, theme, Tooltip} from 'antd';
import {PropsWithChildren, useState} from 'react';
import * as project from '@/rm2pt/project';
import {useRouter} from '@bprogress/next';
import {useParams, usePathname} from 'next/navigation';
import classNames from 'classnames';
const {Sider} = Layout;
const ProjectLayout = ({children}: PropsWithChildren) => {
  const params = useParams();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const projectTitle = 'LangChain OCL';
  const title = 'Project / Use Case / Operation';
  const router = useRouter();
  const {token} = theme.useToken();
  let selectedKey;
  const projectKey = `/${params.project}`;
  const useCaseKey = `${projectKey}/${params.useCase}`;
  const operationKey = `${useCaseKey}/${params.operation}`;
  if (pathname === '/overview') {
    selectedKey = 'overview';
  } else {
    selectedKey = operationKey;
  }

  const [selectedKeys, setSelecedtKeys] = useState([selectedKey]);
  return (
    <Layout style={{minHeight: '100vh'}}>
      <Sider
        theme="light"
        collapsible
        width={270}
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="p-6 text-center" style={{color: token.colorPrimary, fontWeight: 'bold'}}>
          {collapsed ? (
            <>
              <Tooltip title={projectTitle}>LO</Tooltip>
            </>
          ) : (
            projectTitle
          )}
        </div>
        <Menu
          selectedKeys={selectedKeys}
          defaultOpenKeys={[projectKey, useCaseKey, operationKey]}
          style={{height: 'calc(100vh - 70px - 48px)', overflow: 'auto'}}
          defaultSelectedKeys={['1']}
          mode="inline"
          items={[
            {
              key: 'overview',
              label: 'Overview',
              onClick: () => {
                setSelecedtKeys(['overview']);
                router.push('/overview');
              },
            },
            {
              key: 'experiment',
              label: 'Experiment',
              onClick: () => {
                setSelecedtKeys(['experiment']);
                router.push('/experiment');
              },
            },
            {
              key: 'test-coverage',
              label: 'Test Coverage',
              onClick: () => {
                setSelecedtKeys(['test-coverage']);
                router.push('/test-coverage');
              },
            },
            {
              label: (
                <div
                  className={classNames({
                    'text-center': collapsed,
                  })}
                >
                  {collapsed ? (
                    <>
                      <Tooltip title={title}>PUO</Tooltip>
                    </>
                  ) : (
                    title
                  )}
                </div>
              ),
              key: 'root',
              type: 'group',
              children: Object.entries(project).map(([project, {useCase}]) => ({
                key: `/${project}`,
                label: project,
                children: Object.entries(useCase)
                  .filter(
                    ([
                      ,
                      {
                        relatedService: {operations},
                      },
                    ]) => operations.length > 0
                  )
                  .map(
                    ([
                      useCase,
                      {
                        relatedService: {operations},
                      },
                    ]) => ({
                      key: `/${project}/${useCase}`,
                      label: useCase,
                      children: operations.map(({name}) => {
                        const key = `/${project}/${useCase}/${name}`;
                        return {
                          key,
                          label: name,
                          onClick() {
                            setSelecedtKeys([key]);
                            router.push(key);
                          },
                        };
                      }),
                    })
                  ),
              })),
            },
          ]}
        />
      </Sider>
      <Layout className="!bg-white">{children}</Layout>
    </Layout>
  );
};
export default ProjectLayout;
