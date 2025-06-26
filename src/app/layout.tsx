import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';

import { ConvexClientProvider } from '@/app/ConvexClientProvider';
import { Root } from '@/components/features/Root/Root';

import '@telegram-apps/telegram-ui/dist/styles.css';
import 'normalize.css/normalize.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reseller Bot - P2P Marketplace',
  description: 'Buy and sell items in your community through Telegram',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ConvexClientProvider>
          <Root>{children}</Root>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
