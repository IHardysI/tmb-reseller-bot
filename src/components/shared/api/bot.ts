const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const token = process.env.BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!token) {
  console.error('BOT_TOKEN is required in .env.local file');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg: any) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name;
  
  bot.sendMessage(chatId, `👋 Hello ${firstName}! Welcome to Peer Swap!\n\nClick the button below to open the app:`, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🚀 Open Reseller App",
          web_app: { url: appUrl }
        }
      ]]
    }
  });
});

bot.on('message', (msg: any) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text && !text.startsWith('/')) {
    bot.sendMessage(chatId, 'Use /start to open the app!');
  }
});

bot.on('polling_error', (error: any) => {
  console.error('Bot polling error:', error);
});

bot.on('error', (error: any) => {
  console.error('Bot error:', error);
});

console.log('🤖 Bot is running...');
console.log('📱 Mini App URL:', appUrl);

export default bot; 