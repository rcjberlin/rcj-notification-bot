interface IAdminCommandHandler {
  [command: string]: {
    args: string[];
    helpText: string;
    handler: Function;
  };
}

export const adminCommandHandlers: IAdminCommandHandler = {
  send: {
    args: ["msg"],
    helpText:
      "Sends the message _<msg>_ to multiple channels. " +
      "The channels can be selected in the inline keyboard which will be sent as a reply. " +
      "This inline keyboard includes buttons to send the message to the selected channels or cancel the command.",
    handler: (ctx) => {
      // TODO: reply with inline keyboard
      ctx.reply("coming soon...");
    },
  },
};
