from typing import List
import os

from bots.messenger_bot import MessengerBot


class TelegramBot(MessengerBot):
	def __init__(self):
		super().__init__()
		os.getenv("TELEGRAM_BOT_TOKEN")

	def sendMessageToChannels(self, message: str, channels: List[str]) -> int:
		print("send message", message, channels)
		return 0