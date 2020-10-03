import dot_env

from bots.bot_manager import BotManager
from bots.telegram.telegram_bot import TelegramBot

botManager = BotManager([
    TelegramBot()
])

#botManager.sendMessageToChannels("Hello, World!", ["*"])
