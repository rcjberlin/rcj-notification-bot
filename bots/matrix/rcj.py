from maubot import Plugin, MessageEvent
from maubot.handlers import event
from mautrix.types import EventType, MessageType, UserID, RoomID

class RcjBot(Plugin):
	@event.on(EventType.ROOM_MESSAGE)
	async def handler(self, evt: MessageEvent) -> None:
		await evt.mark_read()
		if evt.sender == self.client.mxid or evt.content.msgtype != MessageType.TEXT:
			return
		msg = evt.content.body
		resp = msg[::-1]
		await evt.respond(resp, allow_html=False) # use evt.reply to quote message

