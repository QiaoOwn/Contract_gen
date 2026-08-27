import type {Metadata} from 'next';
import Registry from './Registry';
import './globals.css';
import {AntdRegistry} from '@ant-design/nextjs-registry';
export const metadata: Metadata = {
  title: 'ContractGen',
  description: 'ContractGen',
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
        <Registry>
          <AntdRegistry>{children}</AntdRegistry>
        </Registry>
      </body>
    </html>
  );
}
