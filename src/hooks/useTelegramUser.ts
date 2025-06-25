import { useMemo } from 'react';
import { 
  initDataState, 
  useSignal,
  type User,
  type Chat 
} from '@telegram-apps/sdk-react';

export function useTelegramUser() {
  const initData = useSignal(initDataState);
  
  const user = useMemo(() => initData?.user, [initData]);
  const chat = useMemo(() => initData?.chat, [initData]);
  const startParam = useMemo(() => initData?.start_param, [initData]);
  const authDate = useMemo(() => initData?.auth_date, [initData]);
  
  return {
    user,
    chat,
    startParam,
    authDate,
    isUserAvailable: !!user,
    userId: user?.id,
    userName: user?.username,
    userFirstName: user?.first_name,
    userLastName: user?.last_name,
    userLanguage: user?.language_code,
    userIsPremium: user?.is_premium,
    rawInitData: initData
  };
} 