import config = require("../../bot-manager/utils/config");
import channels = require("../../bot-manager/utils/channels");
import request = require("../../bot-manager/utils/request");

const INLINE_KEYBOARD_COMMAND = {
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  ADMIN_SEND_MESSAGE: "adminsendmessage",
  ADMIN_CANCEL_SEND_MESSAGE: "admincancel",
  ADMIN_SELECT_CHANNEL: "adminselect",
  ADMIN_DESELECT_CHANNEL: "admindeselect",
};

type tChannelId = Number | String;
export interface IChannel {
  id: tChannelId;
  channel: String;
}

export function channelsForChatAsReplyMarkup(
  subscribedChannelIds: tChannelId[],
  options: {
    onlySubscribedChannels?: Boolean;
    actionForSubscribedChannel?: string;
    actionForUnsubscribedChannel?: string;
    iconSelected?: string;
  } = {}
) {
  // prepare inline keyboard to list channels for a chat
  // inline_keyboard is an array (rows) of arrays (buttons)
  const inlineKeyboardChannels = [[]];
  let numberOfChannelsAddedToInlineKeyBoard = 0;
  for (let i = 0; i < channels.length; i++) {
    const isChannelSubscribed = subscribedChannelIds.includes(channels[i].id.toString());
    if (options.onlySubscribedChannels && !isChannelSubscribed) continue;
    inlineKeyboardChannels[inlineKeyboardChannels.length - 1].push({
      text:
        (isChannelSubscribed ? "-" : "+") +
        " " +
        channels[i].channel +
        (isChannelSubscribed ? ` ${options.iconSelected ? options.iconSelected : "🔔"}` : ""),
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

export function channelsForAdminSelectionAsReplyMarkup(selectedChannels: tChannelId[]) {
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
        ...channelsForChatAsReplyMarkup(selectedChannels, {
          actionForSubscribedChannel: INLINE_KEYBOARD_COMMAND.ADMIN_DESELECT_CHANNEL,
          actionForUnsubscribedChannel: INLINE_KEYBOARD_COMMAND.ADMIN_SELECT_CHANNEL,
          iconSelected: "✅️",
        }).reply_markup.inline_keyboard,
      ],
    },
  };
}

export function getDefaultAdminDataObject() {
  return { message: "", selectedChannelIds: [] };
}

interface IInlineKeyboardCommandHandler {
  regex: RegExp;
  handler: (ctx, callbackData: string, regexMatch: string[]) => void | Promise<void>;
}

export const inlineKeyboardCommandHandlers: IInlineKeyboardCommandHandler[] = [
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.SUBSCRIBE} ([ao]{1}) (.*)$`),
    handler: (ctx, callbackData: string, regexMatch: string[]) => {
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
        `Subscribed ${channels.find((channel: IChannel) => channel.id.toString() === channelId).channel}`,
        channelsForChatAsReplyMarkup(ctx.chat_data.channelIds, {
          onlySubscribedChannels: listAllOrOnlySubsribedChannels === "o",
        })
      );
    },
  },
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.UNSUBSCRIBE} ([ao]{1}) (.*)$`),
    handler: (ctx, callbackData: string, regexMatch: string[]) => {
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
        `Unsubscribed ${channels.find((channel: IChannel) => channel.id.toString() === channelId).channel}`,
        channelsForChatAsReplyMarkup(ctx.chat_data.channelIds, {
          onlySubscribedChannels: listAllOrOnlySubsribedChannels === "o",
        })
      );
    },
  },
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.ADMIN_SELECT_CHANNEL} ([ao]{1}) (.*)$`),
    handler: (ctx, callbackData: string, regexMatch: string[]) => {
      if (ctx.is_admin !== true) return;
      const [listAllOrOnlySubsribedChannels, channelId] = regexMatch;
      if (!ctx.chat_data.admin) {
        ctx.chat_data.admin = getDefaultAdminDataObject();
      }
      if (!ctx.chat_data.admin.selectedChannelIds.includes(channelId)) {
        ctx.chat_data.admin.selectedChannelIds.push(channelId);
      }
      ctx.telegram.editMessageText(
        ctx.update.callback_query.message.chat.id,
        ctx.update.callback_query.message.message_id,
        null,
        ...getSendAdminMessageArgs(ctx)
      );
    },
  },
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.ADMIN_DESELECT_CHANNEL} ([ao]{1}) (.*)$`),
    handler: (ctx, callbackData: string, regexMatch: string[]) => {
      if (ctx.is_admin !== true) return;
      const [listAllOrOnlySubsribedChannels, channelId] = regexMatch;
      if (!ctx.chat_data.admin) {
        ctx.chat_data.admin = getDefaultAdminDataObject();
      }
      const index = ctx.chat_data.admin.selectedChannelIds.indexOf(channelId);
      if (index > -1) {
        ctx.chat_data.admin.selectedChannelIds.splice(index, 1);
      }
      ctx.telegram.editMessageText(
        ctx.update.callback_query.message.chat.id,
        ctx.update.callback_query.message.message_id,
        null,
        ...getSendAdminMessageArgs(ctx)
      );
    },
  },
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.ADMIN_SEND_MESSAGE}$`),
    handler: async (ctx, callbackData: string, regexMatch: string[]) => {
      if (ctx.is_admin !== true) return;
      if (ctx.chat_data.admin.selectedChannelIds.length > 0) {
        const { message, selectedChannelIds } = ctx.chat_data.admin;
        ctx.telegram.editMessageText(
          ctx.update.callback_query.message.chat.id,
          ctx.update.callback_query.message.message_id,
          null,
          getSendAdminMessageArgs(ctx)[0] + ".."
        );
        const result = await request(
          "POST",
          `http://localhost:${config.botmanager.INTERNAL_PORT}/v1/send`,
          {},
          {
            message,
            channelIds: selectedChannelIds,
          }
        );
        if (result && result.status === 200 && result.json && result.json.successful) {
          ctx.chat_data.admin.message = "";
          ctx.chat_data.admin.selectedChannelIds = [];
          const { users } = result.json.data;
          ctx.telegram.editMessageText(
            ctx.update.callback_query.message.chat.id,
            ctx.update.callback_query.message.message_id,
            null,
            `Sent message "${message}" to channels ${channelIdsToChannelList(selectedChannelIds)}. (${users} user${users === 1 ? "" : "s"})`
          );
        } else {
          ctx.telegram.editMessageText(
            ctx.update.callback_query.message.chat.id,
            ctx.update.callback_query.message.message_id,
            null,
            ...getSendAdminMessageArgs(ctx).map((value, index) =>
              index === 0 ? value + "\n\nFailed to send message. Please try again." : value
            )
          );
        }
      } else {
        ctx.telegram.editMessageText(
          ctx.update.callback_query.message.chat.id,
          ctx.update.callback_query.message.message_id,
          null,
          ...getSendAdminMessageArgs(ctx).map((value, index) => (index === 0 ? value + "\n\nPlease select a channel." : value))
        );
      }
    },
  },
  {
    regex: new RegExp(`^${INLINE_KEYBOARD_COMMAND.ADMIN_CANCEL_SEND_MESSAGE}$`),
    handler: (ctx, callbackData: string, regexMatch: string[]) => {
      if (ctx.is_admin !== true) return;
      ctx.chat_data.admin.message = "";
      ctx.chat_data.admin.selectedChannelIds = [];
      ctx.telegram.editMessageText(
        ctx.update.callback_query.message.chat.id,
        ctx.update.callback_query.message.message_id,
        null,
        "Canceled sending message"
      );
    },
  },
];

export function getSendAdminMessageArgs(ctx): Array<any> {
  return [
    `Sending message "${ctx.chat_data.admin.message}" to channels ${channelIdsToChannelList(ctx.chat_data.admin.selectedChannelIds)}.`,
    channelsForAdminSelectionAsReplyMarkup(ctx.chat_data.admin.selectedChannelIds),
  ];
}

export function channelIdsToChannelList(channelIds: tChannelId[]) {
  return `[${channelIds.reduce(
    (text, channelId, index) =>
      text + (index !== 0 ? ", " : "") + channels.find((channel: IChannel) => channel.id.toString() === channelId).channel,
    ""
  )}]`;
}
