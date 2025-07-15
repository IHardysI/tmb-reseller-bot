/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as categories from "../categories.js";
import type * as chats from "../chats.js";
import type * as complaints from "../complaints.js";
import type * as http from "../http.js";
import type * as moderation from "../moderation.js";
import type * as posts from "../posts.js";
import type * as userBlocks from "../userBlocks.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  chats: typeof chats;
  complaints: typeof complaints;
  http: typeof http;
  moderation: typeof moderation;
  posts: typeof posts;
  userBlocks: typeof userBlocks;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
