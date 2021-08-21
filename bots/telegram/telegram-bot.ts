import config = require("../../bot-manager/utils/config");

import { Telegraf } from "telegraf";
import * as middleware from "./bot-middleware";
import * as inlineKeyboard from "./inline-keyboard";
import { adminCommandHandlers } from "./admin-commands";
import { getChatIdsThatSubscribedOneOfChannelIds } from "./chat-data-persistence";
import channels = require("../../bot-manager/utils/channels");
import { i18n } from "./i18n";


class TelegramBot {
  private bot: any;
  private HELP_TEXT_ADMIN = "Following admin commands/messages are available:\n";

  constructor() {
    this.bot = new Telegraf(config.bots.telegram.TELEGRAM_BOT_TOKEN);

    this.bot.use(middleware.setIsAdmin);
    this.bot.use(middleware.chatDataPersistence);
    this.registerAdminCommands();
    this.registerInlineKeyboardCallbackHandler();

    this.bot.command("/channels", async (ctx) => {
      ctx.reply("Channels:", inlineKeyboard.channelsForChatAsReplyMarkup(ctx.chat_data.channelIds || []));
    });
    this.bot.command("/mychannels", async (ctx) => {
      if (!ctx.chat_data.channelIds || ctx.chat_data.channelIds.length === 0) {
        ctx.reply(i18n.you_dont_have_any_subscribed_channels_yet(ctx.chat_data.language));
      } else {
        ctx.reply(
          i18n.your_channels(ctx.chat_data.language),
          inlineKeyboard.channelsForChatAsReplyMarkup(ctx.chat_data.channelIds, {
            onlySubscribedChannels: true,
          })
        );
      }
    });

    this.bot.command("/language", async (ctx) => {
      ctx.reply(
        i18n.languages(ctx.chat_data.language),
        inlineKeyboard.languagesForChatAsReplyMarkup(ctx.chat_data.language)
      );
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

    this.bot.start(this.sendHelp.bind(this));
    this.bot.help(this.sendHelp.bind(this));

    this.bot.launch();

    this.bot.telegram.getMe().then((botInfo) => {
      console.log(`Telegram Bot @${botInfo.username} started`);
    });
  }

  sendMessageToChannels(message: string, channelIds: Array<Number | String>): number {
    const chatIds = getChatIdsThatSubscribedOneOfChannelIds(channelIds);
    for (const chatId of chatIds) {
      this.bot.telegram.sendMessage(chatId, `${inlineKeyboard.channelIdsToChannelList(channelIds)}\n${message}`);
    }
    return chatIds.length;
  }

  private registerAdminCommands() {
    for (const command in adminCommandHandlers) {
      const argsHelpText = adminCommandHandlers[command].args.map((arg) => " <" + arg + ">").join("");
      this.HELP_TEXT_ADMIN += `\n*${command}${argsHelpText}*:\n${adminCommandHandlers[command].helpText}\n`;
    }
    this.bot.on("text", async (ctx, next) => {
      if (ctx.is_admin === true) {
        const words = ctx.message.text.split(" ");
        const command = words[0].toLowerCase();
        if (command in adminCommandHandlers) {
          await adminCommandHandlers[command].handler(ctx, command);
        }
      }
      next();
    });
  }

  private registerInlineKeyboardCallbackHandler() {
    for (const inlineKeyboardCommandHandler of inlineKeyboard.inlineKeyboardCommandHandlers) {
      this.bot.action(inlineKeyboardCommandHandler.regex, async (ctx, next) => {
        const callbackData = ctx.update.callback_query.data;
        const regexMatch = inlineKeyboardCommandHandler.regex.exec(callbackData);
        if (regexMatch === null) {
          this.notifyDevelopersAboutError(
            `Failed to get matches for callback data ${callbackData} using regex ${inlineKeyboardCommandHandler.regex}`
          );
          return next();
        }
        await inlineKeyboardCommandHandler.handler(ctx, callbackData, regexMatch.slice(1));
        next();
      });
    }
  }

  private async sendHelp(ctx) {
    await ctx.replyWithMarkdown(i18n.HELP_TEXT(ctx.chat_data.language));
    if (ctx.is_admin && this.HELP_TEXT_ADMIN) {
      ctx.replyWithMarkdown(this.HELP_TEXT_ADMIN);
    }
  }

  private notifyDevelopersAboutError(message: string): void {
    for (const chatId of config.bots.telegram.TELEGRAM_CHAT_IDS_NOTIFY_ON_ERROR) {
      this.bot.telegram.sendMessage(chatId, message);
    }
  }
}

export const bot = new TelegramBot();
