import {ReactJsonViewProps} from '@microlink/react-json-view';
import dynamic from 'next/dynamic';

export const LoadableJsonView = dynamic<ReactJsonViewProps>(
  () => import('@microlink/react-json-view'),
  {
    ssr: false,
  }
);
