const fs = require("fs");
const FILENAME_CHAT_DATA = "telegram-chats.json";

let CHAT_DATA = {};
try {
  const fileContent = fs.readFileSync(FILENAME_CHAT_DATA, "utf8");
  CHAT_DATA = JSON.parse(fileContent);
} catch (err) {
  console.log(`Failed to read ${FILENAME_CHAT_DATA}`, err);
}

export async function chatDataPersistence(ctx: any, next: Function) {
  if (!ctx || !ctx.chat || !ctx.chat.id) {
    return next();
  }
  try {
    ctx.chat_data = cloneObject(CHAT_DATA[ctx.chat.id] || {});
  } catch {
    ctx.chat_data = {};
  }

  await next();

  CHAT_DATA[ctx.chat.id] = ctx.chat_data;
  saveChatData();
}

function saveChatData() {
  // TODO: defer and combine multiple writes?
  _writeChatDataToFile();
}
function _writeChatDataToFile() {
  fs.writeFileSync(FILENAME_CHAT_DATA, JSON.stringify(CHAT_DATA), "utf8");
}

function cloneObject(obj: Object): Object {
  return JSON.parse(JSON.stringify(obj));
}

export function getChatIdsThatSubscribedOneOfChannelIds(channelIds: Array<Number | String>): Array<Number | String> {
  const chatIds = [];
  channelIds = channelIds.map((channelId) => channelId.toString());
  for (const chatId in CHAT_DATA) {
    if (CHAT_DATA[chatId].channelIds) {
      for (const subsribedChannel of CHAT_DATA[chatId].channelIds) {
        if (channelIds.includes(subsribedChannel)) {
          chatIds.push(chatId);
          break;
        }
      }
    }
  }
  return chatIds;
}
