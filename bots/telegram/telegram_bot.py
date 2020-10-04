from typing import List
import os

from telegram.ext import Updater, CommandHandler
from bots.telegram.chat_persistence import ChatPersistence

from bots.messenger_bot import MessengerBot


class TelegramBot(MessengerBot):
	def __init__(self):
		super().__init__()

		self.updater = Updater(
			token=os.getenv("TELEGRAM_BOT_TOKEN"),
			persistence=ChatPersistence("./bots/telegram/telegram-chats.json"),
			use_context=True
		)
		self.dispatcher = self.updater.dispatcher

		self.addCommandHandlers()
		self.updater.start_polling()
		print("Telegram Bot @"+ self.updater.bot.username + " started")

	def stop(self):
		self.updater.stop()

	def addCommandHandlers(self):
		self.dispatcher.add_handler(CommandHandler('help', self.help))

	def help(self, update, context):
		n = context.chat_data.get("n")
		if (n == None):
			n = 1
			context.bot.send_message(chat_id=update.effective_chat.id, text="I can't help you")
		else:
			n += 1
			context.bot.send_message(chat_id=update.effective_chat.id, text="You asked for help "+str(n)+" times now!")
		context.chat_data["n"] = n

	def sendMessageToChannels(self, message: str, channels: List[str]) -> int:
		print("send message", message, channels)
		return 0
