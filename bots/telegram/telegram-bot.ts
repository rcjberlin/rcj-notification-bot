import { MessengerBot } from "../messenger-bot";
import CHANNELS from "../channels";

const fs = require("fs");
const { Telegraf } = require("telegraf");

const HELP_TEXT = `Hello, this Telegram Bot will send notifications to different channels. You can subscribe the channels relevant for you by listing all channels with /channels and then select the ones you want. Click again to unsubscribe.
To view only a list of channels you subscribed to, use /mychannels.

You may want to subscribe the General channel. Use /channels to get started.`;

const INLINE_KEYBOARD_COMMAND = {
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  ADMIN_SEND_MESSAGE: "adminsendmessage",
  ADMIN_CANCEL_SEND_MESSAGE: "admincancel",
  ADMIN_SELECT_CHANNEL: "adminselect",
  ADMIN_DESELECT_CHANNEL: "admindeselect",
};

const ADMIN_USERNAMES: string[] = [];
try {
  for (const username of JSON.parse(process.env.TELEGRAM_ADMIN_USERNAMES)) {
    ADMIN_USERNAMES.push(username);
  }
} catch {}

type Channel = string;

interface IChatAdmin {
  message: string;
  selectedChannels: Channel[];
}

interface IChat {
  channels: Channel[];
  admin?: IChatAdmin;
}

const FILENAME_CHATS = "./bots/telegram/telegram-chats.json";
const CHATS: { [chatId: number]: IChat } = readChatsFromFile();

function getDefaultChatObject(): IChat {
  return { channels: [] };
}
function getDefaultAdminObject(): IChatAdmin {
  return { message: "", selectedChannels: [] };
}

/*
TODOs:
Proxy for CHATS?
channels as objects (id, name, translation?)
i18n
move code to helper files
*/

export class TelegramBot extends MessengerBot {
  private bot: typeof Telegraf;

  constructor() {
    super();
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.bot.use((ctx, next) => {
      const isAdmin = ctx.chat && ctx.chat.username && ADMIN_USERNAMES.includes(ctx.chat.username);

      // initialize object in CHATS if new chat
      if (ctx.chat && ctx.chat.id && !(ctx.chat.id in CHATS)) {
        CHATS[ctx.chat.id] = getDefaultChatObject();
        if (isAdmin) {
          CHATS[ctx.chat.id].admin = getDefaultAdminObject();
        }
      }

      // if message is sent from an admin -> execute action
      if (isAdmin) {
        // Sending a message to certain channels
        if (ctx.message && ctx.message.text && ctx.message.text.toLowerCase().startsWith("send ")) {
          CHATS[ctx.chat.id].admin.message = ctx.message.text.substr("send".length + 1);
          ctx.telegram.sendMessage(
            ctx.chat.id,
            `Sending Message "${CHATS[ctx.chat.id].admin.message}" to channels [${CHATS[ctx.chat.id].admin.selectedChannels.reduce(
              (text: string, channel: string, index: number) => text + (index !== 0 ? ", " : "") + channel,
              ""
            )}].`,
            channelsForAdminSelectionAsReplyMarkup(CHATS[ctx.chat.id].admin.selectedChannels)
          );
        }
      }

      // execute action if inline keyboard button was pressed
      if (ctx.update.callback_query) {
        const { message, data } = ctx.update.callback_query;
        if (data.startsWith(INLINE_KEYBOARD_COMMAND.SUBSCRIBE + " ")) {
          const channel = data.substr(INLINE_KEYBOARD_COMMAND.SUBSCRIBE.length + 1);
          if (!CHATS[message.chat.id].channels.includes(channel)) {
            CHATS[message.chat.id].channels.push(channel);
          }
          ctx.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            null,
            `Subscribed ${channel}`,
            channelsForChatAsReplyMarkup(CHATS[ctx.chat.id], { onlySubscribedChannels: wasOnlySubscribedChannels(message.reply_markup) })
          );
        } else if (data.startsWith(INLINE_KEYBOARD_COMMAND.UNSUBSCRIBE + " ")) {
          const channel = data.substr(INLINE_KEYBOARD_COMMAND.UNSUBSCRIBE.length + 1);
          const index = CHATS[message.chat.id].channels.indexOf(channel);
          if (index > -1) {
            CHATS[message.chat.id].channels.splice(index, 1);
          }
          ctx.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            null,
            `Unsubscribed ${channel}`,
            channelsForChatAsReplyMarkup(CHATS[ctx.chat.id], { onlySubscribedChannels: wasOnlySubscribedChannels(message.reply_markup) })
          );
        } else if (isAdmin && data.startsWith(INLINE_KEYBOARD_COMMAND.ADMIN_SELECT_CHANNEL + " ")) {
          const channel = data.substr(INLINE_KEYBOARD_COMMAND.ADMIN_SELECT_CHANNEL.length + 1);
          if (!CHATS[message.chat.id].admin.selectedChannels.includes(channel)) {
            CHATS[message.chat.id].admin.selectedChannels.push(channel);
          }
          ctx.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            null,
            `Sending Message "${CHATS[ctx.chat.id].admin.message}" to channels [${CHATS[ctx.chat.id].admin.selectedChannels.reduce(
              (text: string, channel: string, index: number) => text + (index !== 0 ? ", " : "") + channel,
              ""
            )}].`,
            channelsForAdminSelectionAsReplyMarkup(CHATS[ctx.chat.id].admin.selectedChannels)
          );
        } else if (isAdmin && data.startsWith(INLINE_KEYBOARD_COMMAND.ADMIN_DESELECT_CHANNEL + " ")) {
          const channel = data.substr(INLINE_KEYBOARD_COMMAND.ADMIN_DESELECT_CHANNEL.length + 1);
          const index = CHATS[message.chat.id].admin.selectedChannels.indexOf(channel);
          if (index > -1) {
            CHATS[message.chat.id].admin.selectedChannels.splice(index, 1);
          }
          ctx.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            null,
            `Sending Message "${CHATS[ctx.chat.id].admin.message}" to channels [${CHATS[ctx.chat.id].admin.selectedChannels.reduce(
              (text: string, channel: string, index: number) => text + (index !== 0 ? ", " : "") + channel,
              ""
            )}].`,
            channelsForAdminSelectionAsReplyMarkup(CHATS[ctx.chat.id].admin.selectedChannels)
          );
        } else if (isAdmin && data === INLINE_KEYBOARD_COMMAND.ADMIN_SEND_MESSAGE) {
          if (!this.botManager) throw new Error("No BotManager is registered to send messages");
          const numberOfChats = this.botManager.sendMessageToChannels(
            CHATS[ctx.chat.id].admin.message,
            CHATS[ctx.chat.id].admin.selectedChannels
          );
          ctx.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            null,
            `Sent Message "${CHATS[ctx.chat.id].admin.message}" to channels ${channelsToString(
              CHATS[ctx.chat.id].admin.selectedChannels
            )} (${numberOfChats} chat${numberOfChats === 1 ? "" : "s"}).`
          );
          CHATS[ctx.chat.id].admin = getDefaultAdminObject();
        } else if (isAdmin && data === INLINE_KEYBOARD_COMMAND.ADMIN_CANCEL_SEND_MESSAGE) {
          ctx.telegram.editMessageText(message.chat.id, message.message_id, null, `Canceled sending message`);
          CHATS[ctx.chat.id].admin = getDefaultAdminObject();
        }
      }
      next();
    });

    this.bot.command("/channels", async (ctx) => {
      ctx.telegram.sendMessage(ctx.chat.id, "Channels:", channelsForChatAsReplyMarkup(CHATS[ctx.chat.id]));
    });
    this.bot.command("/mychannels", async (ctx) => {
      if (CHATS[ctx.chat.id].channels.length === 0) {
        ctx.telegram.sendMessage(ctx.chat.id, "You don't have any subscribed channels yet. List all /channels and add one.");
      } else {
        ctx.telegram.sendMessage(
          ctx.chat.id,
          "Your Channels:",
          channelsForChatAsReplyMarkup(CHATS[ctx.chat.id], { onlySubscribedChannels: true })
        );
      }
    });

    this.bot.telegram.setMyCommands([
      {
        command: "channels",
        description: "List all available channels",
      },
      {
        command: "mychannels",
        description: "List all your channels",
      },
      {
        command: "help",
        description: "Help",
      },
    ]);

    this.bot.start((ctx) => ctx.reply(HELP_TEXT));
    this.bot.help((ctx) => ctx.reply(HELP_TEXT));
    //this.bot.on("message", ctx => console.log(ctx.message));

    this.bot.launch();

    this.bot.telegram.getMe().then((botInfo) => {
      console.log(`Telegram Bot @${botInfo.username} started`);
    });

    autoSaveChats();
  }

  sendMessageToChannels(message: string, channels: Channel[]): number {
    // looping through all chats and checking whether at least one channels matches with the subscribed ones
    let numberOfChats = 0;
    for (const chatId in CHATS) {
      for (const channel of CHATS[chatId].channels) {
        if (channels.includes(channel)) {
          this.bot.telegram.sendMessage(chatId, `${channelsToString(channels)}\n${message}`);
          numberOfChats++;
          break;
        }
      }
    }
    return numberOfChats;
  }
}

function channelsForChatAsReplyMarkup(
  chat: IChat,
  options: { onlySubscribedChannels?: Boolean; actionForSubscribedChannel?: string; actionForUnsubscribedChannel?: string } = {}
) {
  // prepare inline keyboard to list channels for a chat
  // inline_keyboard is an array (rows) of arrays (buttons)
  const inlineKeyboardChannels = [[]];
  let numberOfChannelsAddedToInlineKeyBoard = 0;
  for (let i = 0; i < CHANNELS.length; i++) {
    const isChannelSubscribed = chat.channels.includes(CHANNELS[i]);
    if (options.onlySubscribedChannels && !isChannelSubscribed) continue;
    inlineKeyboardChannels[inlineKeyboardChannels.length - 1].push({
      text: (isChannelSubscribed ? "-" : "+") + " " + CHANNELS[i],
      callback_data:
        (isChannelSubscribed
          ? options.actionForSubscribedChannel || INLINE_KEYBOARD_COMMAND.UNSUBSCRIBE
          : options.actionForUnsubscribedChannel || INLINE_KEYBOARD_COMMAND.SUBSCRIBE) +
        " " +
        CHANNELS[i],
    });
    // break row (at most 2 buttons per row; odd number: single/full-width button first)
    if (numberOfChannelsAddedToInlineKeyBoard++ % 2 !== (options.onlySubscribedChannels ? chat.channels : CHANNELS).length % 2) {
      inlineKeyboardChannels.push([]);
    }
  }
  return {
    reply_markup: {
      inline_keyboard: inlineKeyboardChannels,
    },
  };
}

function channelsForAdminSelectionAsReplyMarkup(selectedChannels: Channel[]) {
  // prepare inline keyboard for admin to (de)select channels for an action (e.g. sending message to certain channels)
  // building upon above method to create inline keyboard + insert send and cancel button
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Send",
            callback_data: INLINE_KEYBOARD_COMMAND.ADMIN_SEND_MESSAGE,
          },
          {
            text: "Cancel",
            callback_data: INLINE_KEYBOARD_COMMAND.ADMIN_CANCEL_SEND_MESSAGE,
          },
        ],
        ...channelsForChatAsReplyMarkup(
          { channels: selectedChannels },
          {
            actionForSubscribedChannel: INLINE_KEYBOARD_COMMAND.ADMIN_DESELECT_CHANNEL,
            actionForUnsubscribedChannel: INLINE_KEYBOARD_COMMAND.ADMIN_SELECT_CHANNEL,
          }
        ).reply_markup.inline_keyboard,
      ],
    },
  };
}

function wasOnlySubscribedChannels(reply_markup) {
  // deducing whether to reply with complete list of channels or only with subscribed ones
  // -> if subscribe action included (-> unsubscribed channel) -> no / was complete list
  for (const rows of reply_markup.inline_keyboard) {
    for (const inlineKeyBoardButton of rows) {
      if (inlineKeyBoardButton.callback_data.startsWith(INLINE_KEYBOARD_COMMAND.SUBSCRIBE + " ")) {
        return false;
      }
    }
  }
  return true;
}

function channelsToString(channels: Channel[]) {
  return `[${channels.reduce((text, channel, index) => text + (index !== 0 ? ", " : "") + channel, "")}]`;
}

function readChatsFromFile() {
  try {
    const fileContent = fs.readFileSync(FILENAME_CHATS, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.log(`Error while reading chats from ${FILENAME_CHATS}:`, error);
  }
  return {};
}

function autoSaveChats(ms = 10000) {
  setTimeout(async function () {
    await saveChats();
    autoSaveChats();
  }, ms);
}
async function saveChats(logging = false) {
  return new Promise((resolve, reject) => {
    fs.writeFile(FILENAME_CHATS, JSON.stringify(CHATS, null, 2), "utf8", (err) => {
      if (err) throw err;
      if (logging) console.log("Saved chats");
      resolve();
    });
  });
}
