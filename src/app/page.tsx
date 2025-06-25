'use client';

import { useQuery } from 'convex/react';
import { Section, Cell, List } from '@telegram-apps/telegram-ui';
import { Link } from '@/components/Link/Link';
import { Page } from '@/components/Page';
import { AuthGuard } from '@/components/AuthGuard';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { api } from '../../convex/_generated/api';

function HomeContent() {
  const { userId } = useTelegramUser();
  
  const existingUser = useQuery(
    api.users.getUserByTelegramId,
    userId ? { telegramId: userId } : 'skip'
  );

  return (
    <Page back={false}>
      <Section>
        <List>
          <Cell>Welcome back, {existingUser?.firstName}!</Cell>
        </List>
      </Section>
    </Page>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}