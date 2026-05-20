import type {GetOperationCodeParams} from '@/app/service/operationCodeShared';
import Operation from './component/Operation';

export const runtime = 'nodejs';

type PageProps = {
  params: Promise<GetOperationCodeParams>;
};

export default async function Page({params}: PageProps) {
  const getOperationCodeParams = await params;
  const {default: getOperationCode} = await import('@/app/service/getOperationCode');
  const props = await getOperationCode(getOperationCodeParams);
  return <Operation {...props} />;
}
