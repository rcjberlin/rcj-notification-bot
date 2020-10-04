from typing import List
import os
import sys
import traceback
from threading import Thread

from telegram import ParseMode
from telegram.ext import Updater, Defaults, CommandHandler, MessageHandler, Filters

from bots.telegram.chat_persistence import ChatPersistence
from bots.telegram.admin_handlers import getAdminUsernames, getAdminMessageHandlers, getDevUserIdsToNotifyOnError
from bots.messenger_bot import MessengerBot


class TelegramBot(MessengerBot):
	HELP_TEXT = """Hello, this Telegram Bot will send notifications to different channels. You can subscribe the channels relevant for you by listing all channels with /channels and then select the ones you want. Click again to unsubscribe.
To view only a list of channels you subscribed to, use /mychannels.

You may want to subscribe the General channel. Use /channels to get started."""
	ADMIN_HELP_TEXT = "Following admin commands/messages are available:\n"

	def __init__(self):
		super().__init__()

		self.updater = Updater(
			token=os.getenv("TELEGRAM_BOT_TOKEN"),
			persistence=ChatPersistence("./bots/telegram/telegram-chats.json"),
			defaults=Defaults(parse_mode=ParseMode.MARKDOWN),
			use_context=True
		)
		self.dispatcher = self.updater.dispatcher
		self.adminUsernames = getAdminUsernames()
		self.commands = [
			{
				"command": "channels",
				"description": "List all available channels",
				"handler": self.notYetImplemented,
			},
			{
				"command": "mychannels",
				"description": "List all your channels",
				"handler": self.notYetImplemented,
			},
			{
				"command": "help",
				"description": "Help",
				"handler": self.help,
			},
		]

		self.addCommandHandlers()
		self.addAdminMessageHandlers()
		self.addErrorHandler()

		self.updater.start_polling()
		print("Telegram Bot @"+ self.updater.bot.username + " started")

	def stop(self):
		self.updater.stop()

	def addCommandHandlers(self):
		self.dispatcher.add_handler(CommandHandler('start', self.help))
		for cmd in self.commands:
			self.dispatcher.add_handler(CommandHandler(cmd["command"], cmd["handler"]))

		self.updater.bot.set_my_commands([(cmd["command"], cmd["description"]) for cmd in self.commands])

	def help(self, update, context):
		update.message.reply_text(self.HELP_TEXT)

		if (update.message.from_user.username in self.adminUsernames):
			update.message.reply_text(self.ADMIN_HELP_TEXT)

	def notYetImplemented(self, update, context):
		update.message.reply_text("This command is not yet implemented.")


	def addAdminMessageHandlers(self):
		for handler in getAdminMessageHandlers():
			self.dispatcher.add_handler(MessageHandler(Filters.user(username=self.adminUsernames) & handler.filter(), handler.handler))
			self.ADMIN_HELP_TEXT += "\n" + handler.getHelpText() + "\n"

	def addErrorHandler(self):
		self.dispatcher.add_error_handler(self.errorHandler)

	def errorHandler(self, update, context):
		# https://github.com/python-telegram-bot/python-telegram-bot/wiki/Code-snippets#an-good-error-handler
		if update.effective_message:
			update.effective_message.reply_text("An error occurred. The developers have been notified and are working on it.")

		message = "An Error occurred: " + str(context.error)
		trace = traceback.format_tb(sys.exc_info()[2])
		print(str(context.error) + "\n" + "".join(trace))
		for dev in getDevUserIdsToNotifyOnError():
			context.bot.send_message(dev, message + "\n" + str(trace[-1]), parse_mode=None)

	def sendMessageToChannels(self, message: str, channels: List[str]) -> int:
		print("send message", message, channels)
		return 0
