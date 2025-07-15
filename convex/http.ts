import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { httpRouter } from "convex/server";

const http = httpRouter();

http.route({
  path: "/updateUserChatId",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
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
  }),
});

export default http;
