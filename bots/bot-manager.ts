import { MessengerBot } from "./messenger-bot";

export class BotManager {
  private bots: MessengerBot[];
  constructor(bots: MessengerBot[]) {
    this.bots = bots;
    for (const bot of this.bots) {
      bot.registerBotManager(this);
    }
  }

  sendMessageToChannels(message: string, channels: string[]): number {
    let numberOfChats = 0;
    for (const bot of this.bots) {
      numberOfChats += bot.sendMessageToChannels(message, channels);
    }
    return numberOfChats;
  }
}
