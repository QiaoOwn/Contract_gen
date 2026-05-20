'use client';
import {FC} from 'react';
import * as project from '@/rm2pt/project';
import {Table} from 'antd';
const Page: FC = () => {
  const dataSource = Object.entries(project).map(([name, data]) => {
    return {
      name,
      useCaseNumber: Object.keys(data.useCase).length,
      entityNumber: Object.keys(data.entity).length,
      operationNumber: Object.values(data.useCase).reduce(
        (acc, useCase) => acc + useCase.relatedService.operations.length,
        0
      ),
      serviceNumber: Object.keys(data.useCase).length,
      actorNumber: Object.keys(data.actor).length,
    };
  });
  dataSource.push({
    name: 'Total',
    useCaseNumber: dataSource.reduce((acc, item) => acc + item.useCaseNumber, 0),
    operationNumber: dataSource.reduce((acc, item) => acc + item.operationNumber, 0),
    serviceNumber: dataSource.reduce((acc, item) => acc + item.serviceNumber, 0),
    entityNumber: dataSource.reduce((acc, item) => acc + item.entityNumber, 0),
    actorNumber: dataSource.reduce((acc, item) => acc + item.actorNumber, 0),
  });
  return (
    <>
      <Table
        rowKey={'name'}
        columns={[
          {
            dataIndex: 'name',
            title: 'Project',
            render: (text) => (text === 'Total' ? <b>{text}</b> : text),
          },
          {dataIndex: 'useCaseNumber', title: 'Use Case'},
          {dataIndex: 'operationNumber', title: 'Operation'},
          {dataIndex: 'serviceNumber', title: 'Service'},
          {dataIndex: 'entityNumber', title: 'Entity'},
          {dataIndex: 'actorNumber', title: 'Actor'},
        ]}
        dataSource={dataSource}
      />
    </>
  );
};
export default Page;
