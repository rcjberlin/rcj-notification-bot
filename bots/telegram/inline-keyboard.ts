const INLINE_KEYBOARD_COMMAND = {
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  ADMIN_SEND_MESSAGE: "adminsendmessage",
  ADMIN_CANCEL_SEND_MESSAGE: "admincancel",
  ADMIN_SELECT_CHANNEL: "adminselect",
  ADMIN_DESELECT_CHANNEL: "admindeselect",
};

type tChannelId = Number | String;
interface IChannel {
  id: tChannelId;
  channel: String;
}

export function channelsForChatAsReplyMarkup(
  channels: IChannel[],
  subscribedChannelIds: tChannelId[],
  options: { onlySubscribedChannels?: Boolean; actionForSubscribedChannel?: string; actionForUnsubscribedChannel?: string } = {}
) {
  // prepare inline keyboard to list channels for a chat
  // inline_keyboard is an array (rows) of arrays (buttons)
  const inlineKeyboardChannels = [[]];
  let numberOfChannelsAddedToInlineKeyBoard = 0;
  for (let i = 0; i < channels.length; i++) {
    const isChannelSubscribed = subscribedChannelIds.includes(channels[i].id.toString());
    if (options.onlySubscribedChannels && !isChannelSubscribed) continue;
    inlineKeyboardChannels[inlineKeyboardChannels.length - 1].push({
      text: (isChannelSubscribed ? "-" : "+") + " " + channels[i].channel + (isChannelSubscribed ? " 🔔" : ""),
      // store 1) type of action / command 2) whether *o*nly subscribed channels or *a*ll channels 3) which channel
      callback_data:
        (isChannelSubscribed
          ? options.actionForSubscribedChannel || INLINE_KEYBOARD_COMMAND.UNSUBSCRIBE
          : options.actionForUnsubscribedChannel || INLINE_KEYBOARD_COMMAND.SUBSCRIBE) +
        " " +
        (options.onlySubscribedChannels ? "o" : "a") +
        " " +
        channels[i].id,
    });
    // break row (at most 2 buttons per row; odd number: single/full-width button first)
    if (numberOfChannelsAddedToInlineKeyBoard++ % 2 !== (options.onlySubscribedChannels ? subscribedChannelIds : channels).length % 2) {
      inlineKeyboardChannels.push([]);
    }
  }
  return {
    reply_markup: {
      inline_keyboard: inlineKeyboardChannels,
    },
  };
}

export function channelsForAdminSelectionAsReplyMarkup(channels: IChannel[], selectedChannels: tChannelId[]) {
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
        ...channelsForChatAsReplyMarkup(channels, selectedChannels, {
          actionForSubscribedChannel: INLINE_KEYBOARD_COMMAND.ADMIN_DESELECT_CHANNEL,
          actionForUnsubscribedChannel: INLINE_KEYBOARD_COMMAND.ADMIN_SELECT_CHANNEL,
        }).reply_markup.inline_keyboard,
      ],
    },
  };
}

interface IInlineKeyboardCommandHandlerData {
  channels: IChannel[];
}

interface IInlineKeyboardCommandHandler {
  regex: RegExp;
  handler: (ctx, callbackData: string, regexMatch: string[], data: IInlineKeyboardCommandHandlerData) => void;
}

export const inlineKeyboardCommandHandlers: IInlineKeyboardCommandHandler[] = [
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.SUBSCRIBE} ([ao]{1}) (.*)$`),
    handler: (ctx, callbackData: string, regexMatch: string[], data: IInlineKeyboardCommandHandlerData) => {
      const [listAllOrOnlySubsribedChannels, channelId] = regexMatch;
      if (!ctx.chat_data.channelIds) {
        ctx.chat_data.channelIds = [];
      }
      if (!ctx.chat_data.channelIds.includes(channelId)) {
        ctx.chat_data.channelIds.push(channelId);
      }
      ctx.telegram.editMessageText(
        ctx.update.callback_query.message.chat.id,
        ctx.update.callback_query.message.message_id,
        null,
        `Subscribed ${data.channels.find((channel) => channel.id.toString() === channelId).channel}`,
        channelsForChatAsReplyMarkup(data.channels, ctx.chat_data.channelIds, {
          onlySubscribedChannels: listAllOrOnlySubsribedChannels === "o",
        })
      );
    },
  },
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.UNSUBSCRIBE} ([ao]{1}) (.*)$`),
    handler: (ctx, callbackData: string, regexMatch: string[], data: IInlineKeyboardCommandHandlerData) => {
      const [listAllOrOnlySubsribedChannels, channelId] = regexMatch;
      if (!ctx.chat_data.channelIds) {
        ctx.chat_data.channelIds = [];
      }
      const index = ctx.chat_data.channelIds.indexOf(channelId);
      if (index > -1) {
        ctx.chat_data.channelIds.splice(index, 1);
      }
      ctx.telegram.editMessageText(
        ctx.update.callback_query.message.chat.id,
        ctx.update.callback_query.message.message_id,
        null,
        `Unsubscribed ${data.channels.find((channel) => channel.id.toString() === channelId).channel}`,
        channelsForChatAsReplyMarkup(data.channels, ctx.chat_data.channelIds, {
          onlySubscribedChannels: listAllOrOnlySubsribedChannels === "o",
        })
      );
    },
  },
];
