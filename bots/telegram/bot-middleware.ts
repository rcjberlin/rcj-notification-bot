import { format } from "path";
import config = require("../../bot-manager/utils/config");

export * from "./chat-data-persistence";

export function setIsAdmin(ctx: any, next: Function) {
  if (ctx && ctx.from && ctx.from.username && config.bots.telegram.TELEGRAM_ADMIN_USERNAMES.includes(ctx.from.username)) {
    ctx.is_admin = true;
  } else {
    ctx.is_admin = false;
  }
  next();
}
