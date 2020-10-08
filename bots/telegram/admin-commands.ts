import * as inlineKeyboard from "./inline-keyboard";

interface IAdminCommandHandler {
  [command: string]: {
    args: string[];
    helpText: string;
    handler: (ctx, command: string) => void | Promise<void>;
  };
}

export const adminCommandHandlers: IAdminCommandHandler = {
  send: {
    args: ["msg"],
    helpText:
      "Sends the message _<msg>_ to multiple channels. " +
      "The channels can be selected in the inline keyboard which will be sent as a reply. " +
      "This inline keyboard includes buttons to send the message to the selected channels or cancel the command.",
    handler: (ctx, command: string) => {
      if (ctx && ctx.message && ctx.message.text) {
        if (!ctx.chat_data.admin) {
          ctx.chat_data.admin = inlineKeyboard.getDefaultAdminDataObject();
        }
        ctx.chat_data.admin.message = ctx.message.text.substr(command.length + 1);
        ctx.chat_data.admin.selectedChannelIds = [];
        if (ctx.chat_data.admin.message) {
          ctx.reply(...inlineKeyboard.getSendAdminMessageArgs(ctx));
        } else {
          ctx.replyWithMarkdown("Please enter a message, e.g. _send Hello, World!_");
        }
      }
    },
  },
};
