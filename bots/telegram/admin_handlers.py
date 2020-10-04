from typing import List
import os
import json

from telegram.ext import BaseFilter


class CommandFilter(BaseFilter):
	def __init__(self, command):
		self.command = command
	def filter(self, message):
		return message.text.lower() == self.command.lower() or message.text.lower().startswith(self.command.lower() + " ")

class AbstractAdminMessageHandler:
	def __init__(self, command="", args=[], helpText=""):
		self.command = command
		self.args = args
		self.helpText = helpText

	def filter(self):
		return CommandFilter(self.command)

	def handler(self, update, context):
		raise NotImplementedError("Abstract Method")

	def getHelpText(self, formatted=True):
		argsHelpText = "".join([" <"+arg+">" for arg in self.args])
		if formatted:
			return "*" + self.command + argsHelpText + "*:\n" + self.helpText
		else:
			return self.command + argsHelpText + ": " + self.helpText

class SendMessage(AbstractAdminMessageHandler):
	def __init__(self):
		super().__init__("send", ["msg"], "Sends the message _<msg>_ to multiple channels. " + \
			"The channels can be selected in the inline keyboard which will be sent as a reply. " + \
			"This inline keyboard includes buttons to send the message to the selected channels or cancel the command.")

	def handler(self, update, context):
		print("send") # TODO: respond with keyboard to select channels


def getAdminMessageHandlers() -> List[AbstractAdminMessageHandler]:
	return [
		SendMessage(),
	]

# reading admin usernames from env variable TELEGRAM_ADMIN_USERNAMES and parse to list
# reading dev userIds from TELEGRAM_USER_IDS_NOTIFY_ON_ERROR and parse to list
def getAdminUsernames():
	return readArrayFromEnv("TELEGRAM_ADMIN_USERNAMES")

def getDevUserIdsToNotifyOnError():
	return readArrayFromEnv("TELEGRAM_USER_IDS_NOTIFY_ON_ERROR")

def readArrayFromEnv(env: str) -> List:
	try:
		arr = json.loads(os.getenv(env))
		if (type(arr) != list):
			raise ValueError("needs to be an array")
	except Exception as e:
		print("Error when reading environment variable " + env + ":", e)
		print("Using default [] (no admins)")
		arr = []
	return arr
