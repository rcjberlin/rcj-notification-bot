require("dotenv").config();

import { BotManager } from "./bots/bot-manager";
import { TelegramBot } from "./bots/telegram/telegram-bot";

const botManager = new BotManager([new TelegramBot()]);
