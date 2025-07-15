import { mockTelegramEnv, isTMA, emitEvent } from '@telegram-apps/sdk-react';

// It is important, to mock the environment only for development purposes. When building the
// application, the code inside will be tree-shaken, so you will not see it in your final bundle.
export async function mockEnv(): Promise<void> {
  return process.env.NODE_ENV !== 'development'
  ? undefined
  : isTMA('complete').then((isTma) => {
    if (!isTma){ 
      const themeParams = {
        accent_text_color: '#6ab2f2',
        bg_color: '#17212b',
        button_color: '#5288c1',
        button_text_color: '#ffffff',
        destructive_text_color: '#ec3942',
        header_bg_color: '#17212b',
        hint_color: '#708499',
        link_color: '#6ab3f3',
        secondary_bg_color: '#232e3c',
        section_bg_color: '#17212b',
        section_header_text_color: '#6ab3f3',
        subtitle_text_color: '#708499',
        text_color: '#f5f5f5',
      } as const;
      const noInsets = { left: 0, top: 0, bottom: 0, right: 0 } as const;
  
      mockTelegramEnv({
        onEvent(e) {
          if (e[0] === 'web_app_request_theme') {
            return emitEvent('theme_changed', { theme_params: themeParams });
          }
          if (e[0] === 'web_app_request_viewport') {
            return emitEvent('viewport_changed', {
              height: window.innerHeight,
              width: window.innerWidth,
              is_expanded: true,
              is_state_stable: true,
            });
          }
          if (e[0] === 'web_app_request_content_safe_area') {
            return emitEvent('content_safe_area_changed', noInsets);
          }
          if (e[0] === 'web_app_request_safe_area') {
            return emitEvent('safe_area_changed', noInsets);
          }
        },
        launchParams: new URLSearchParams([
          ['tgWebAppThemeParams', JSON.stringify(themeParams)],
          ['tgWebAppData', new URLSearchParams([
            ['auth_date', Math.floor(Date.now() / 1000).toString()],
            ['hash', 'mock-hash-for-development'],
            ['signature', 'mock-signature-for-development'],
            ['user', JSON.stringify({
              id: 123456789,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'en',
              is_premium: false,
              telegramChatId: 123456789
            })],
          ]).toString()],
          ['tgWebAppVersion', '8.4'],
          ['tgWebAppPlatform', 'tdesktop'],
        ]),
      });
  
      console.info(
        '⚠️ Development mode: Using mock Telegram environment. This data is fake and only for local testing.'
      );
    }
  });
}
