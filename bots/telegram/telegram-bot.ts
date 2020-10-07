import config = require("../../bot-manager/utils/config");
import { Telegraf } from "telegraf";

import * as middleware from "./bot-middleware";
import { adminCommandHandlers } from "./admin-commands";

const HELP_TEXT = `Hello, this Telegram Bot will send notifications to different channels. You can subscribe the channels relevant for you by listing all channels with /channels and then select the ones you want. Click again to unsubscribe.
To view only a list of channels you subscribed to, use /mychannels.

You may want to subscribe the General channel. Use /channels to get started.`;

class TelegramBot {
  private bot: any;
  private HELP_TEXT_ADMIN = "Following admin commands/messages are available:\n";

  constructor() {
    this.bot = new Telegraf(config.bots.telegram.TELEGRAM_BOT_TOKEN);

    this.bot.use(middleware.setIsAdmin);
    this.bot.use(middleware.chatDataPersistence);
    // TODO: inline keyboard callbacks
    this.registerAdminCommands();

    this.bot.command("/channels", async (ctx) => {
      ctx.replyWithMarkdown("This command is not yet implemented");
    });
    this.bot.command("/mychannels", async (ctx) => {
      ctx.replyWithMarkdown("This command is not yet implemented");
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

  private registerAdminCommands() {
    for (const command in adminCommandHandlers) {
      const argsHelpText = adminCommandHandlers[command].args.map((arg) => " <" + arg + ">").join("");
      this.HELP_TEXT_ADMIN += `\n*${command}${argsHelpText}*:\n${adminCommandHandlers[command].helpText}\n`;
    }
    this.bot.on("text", (ctx, next) => {
      if (ctx.is_admin) {
        const words = ctx.message.text.split(" ");
        if (words[0] in adminCommandHandlers) {
          adminCommandHandlers[words[0]].handler(ctx);
        }
      }
      next();
    });
  }

  private async sendHelp(ctx) {
    await ctx.replyWithMarkdown(HELP_TEXT);
    if (ctx.is_admin && this.HELP_TEXT_ADMIN) {
      ctx.replyWithMarkdown(this.HELP_TEXT_ADMIN);
    }
  }
}

export const bot = new TelegramBot();
