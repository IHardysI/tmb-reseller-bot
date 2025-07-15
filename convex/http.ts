import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const updateUserChatId = httpAction(async (ctx, request) => {
  const { telegramId, telegramChatId } = await request.json();
  
  try {
    await ctx.runMutation(api.users.updateUserChatId, {
      telegramId: telegramId,
      telegramChatId: telegramChatId,
    });
    
    return new Response("Chat ID updated successfully", { status: 200 });
  } catch (error) {
    console.error("Error updating user chat ID:", error);
    return new Response("Failed to update chat ID", { status: 500 });
  }
});

export const sendMessageNotification = httpAction(async (ctx, request) => {
  const { telegramChatId, itemName, messagePreview, senderName } = await request.json();
  
  try {
    const botToken = process.env.BOT_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!botToken || !appUrl) {
      console.error("Missing BOT_TOKEN or NEXT_PUBLIC_APP_URL environment variables");
      return new Response("Configuration error", { status: 500 });
    }

    const notificationText = `💬 Новое сообщение в чате "${itemName}"\n\n👤 От: ${senderName}\n💭 ${messagePreview}\n\n📱 Откройте приложение, чтобы ответить`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: notificationText,
        reply_markup: {
          inline_keyboard: [[
            {
              text: "📱 Открыть чат",
              web_app: { url: `${appUrl}/messages` }
            }
          ]]
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API error:", errorData);
      return new Response("Failed to send notification", { status: 500 });
    }

    console.log(`✅ Notification sent to chat ${telegramChatId} for item "${itemName}"`);
    return new Response("Notification sent successfully", { status: 200 });
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

// Default export required by Convex
export default {
  updateUserChatId,
  sendMessageNotification,
}; 