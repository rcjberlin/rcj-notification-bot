from typing import List


# TOOD: resolve cyclic dependency

class BotManager:

	def __init__(self, bots):
		self.bots = bots
		for bot in self.bots:
			bot.registerBotManager(self)

	def sendMessageToChannels(self, message: str, channels: List[str]) -> int:
		numberOfChats = 0
		for bot in self.bots:
			numberOfChats += bot.sendMessageToChannels(message, channels)
		return numberOfChats

	def stop(self):
		for bot in self.bots:
			try:
				bot.stop()
			except:
				pass
