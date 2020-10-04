import dot_env

import signal
import sys
from time import sleep

from bots.bot_manager import BotManager
from bots.telegram.telegram_bot import TelegramBot


botManager = BotManager([
    TelegramBot()
])


"""
Stopping script gracefully
    The libary used for the Telegram Bot blocks Ctrl+C and the solution offered
    by the library (i.e. updater.idle()) blocks any further code execution.
    To circumvent this, the code below invokes the .stop() method of all bots.
    Each bot can implement the necessary steps there to stop gracefully.
"""
stopping = False
def signal_handler(sig, frame):
    global stopping
    if stopping: return
    stopping = True
    print("Stopping...")
    botManager.stop()
    sys.exit(0)
for sig in [signal.SIGINT, signal.SIGTERM, signal.SIGABRT]:
    signal.signal(sig, signal_handler)

#signal.pause()
while(1):
    sleep(1)
