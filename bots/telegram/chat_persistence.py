from copy import deepcopy

try:
	import ujson as json
except ImportError:
	import json
from collections import defaultdict
from telegram.ext import BasePersistence


class ChatPersistence(BasePersistence):
	def __init__(self, filePath):
		super().__init__(store_user_data=False,
						store_chat_data=True,
						store_bot_data=False)
		self.filePath = filePath
		self.chat_data = readDictFromFile(self.filePath)

	def get_user_data(self):
		return {}

	def get_chat_data(self):
		if self.chat_data:
			pass
		else:
			self.chat_data = defaultdict(dict)
		return deepcopy(self.chat_data)

	def get_bot_data(self):
		return {}

	def get_conversations(self, name):
		return {}

	def update_conversation(self, name, key, new_state):
		pass

	def update_user_data(self, user_id, data):
		pass

	def update_chat_data(self, chat_id, data):
		if self.chat_data is None:
			self.chat_data = defaultdict(dict)
		self.chat_data[chat_id] = data
		if (self.store_chat_data):
			saveDictToFile(self.chat_data, self.filePath)

	def update_bot_data(self, data):
		pass


def readDictFromFile(filePath: str) -> defaultdict:
	try:
		with open(filePath) as file:
			data = json.load(file)
			data = defaultdict(dict, dict(zip([int(k) for k in data.keys()], list(data.values()))))
	except:
		data = defaultdict(dict)
	return data

def saveDictToFile(data: defaultdict, filePath: str) -> None:
	with open(filePath, 'w') as file:
		json.dump(dict(data), file)
