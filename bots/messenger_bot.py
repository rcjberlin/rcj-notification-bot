from typing import List


# TOOD: resolve cyclic dependency

class MessengerBot:

	botManager = None

	# sends the message to all chats that subscribed at least one of the specified channels
	# returns the number of chats the message was sent to
	def sendMessageToChannels(self, message: str, channels: List[str]) -> int:
		raise NotImplementedError("Abstract Method")

	# method to register a bot manager (after instantiation)
	def registerBotManager(self, botManager) -> None:
		self.botManager = botManager
