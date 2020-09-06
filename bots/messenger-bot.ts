import { BotManager } from "./bot-manager";

export abstract class MessengerBot {
  protected botManager: BotManager;

  // sends the message to all chats that subscribed at least one of the specified channels
  // returns the number of chats the message was sent to
  abstract sendMessageToChannels(message: string, channels: string[]): number;

  // method to register a bot manager (after instantiation)
  registerBotManager(botManager: BotManager): void {
    this.botManager = botManager;
  }

  // TODO: get chats?, get chats per channel? (-> how many chats are subscribed to each channel on which messenger), ...
}
