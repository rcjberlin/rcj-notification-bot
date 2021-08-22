const fileHelper = require("./utils/file-helper");
const path = require("path");

const FILEPATH_MESSAGE_HISTORY = "./history.json";

let messageHistory = null;
async function loadMessageHistory() {
  try {
    messageHistory = JSON.parse(
      await fileHelper.readFile(path.join(__dirname, FILEPATH_MESSAGE_HISTORY))
    );
  } catch {
    messageHistory = [];
  }
}
loadMessageHistory();

/**
 * Stores message log
 * @param {*} messageLog example:
 *   {
 *       message: "example message",
 *       channelIds: [13, 37],
 *       users: 1,
 *       bots: {
 *           bot1: {
 *               successful: true,
 *               users: 1
 *           },
 *           bot2: {
 *               successful: false
 *           }
 *       }
 *   }
 */
function writeLog(messageLog) {
  messageLog.timestamp = new Date().toISOString();
  messageHistory.push(messageLog);
  fileHelper.writeFile(
    FILEPATH_MESSAGE_HISTORY,
    JSON.stringify(messageHistory, null, 2)
  );
}

function getAllLogs() {
    return messageHistory;
}

module.exports = {
  writeLog,
  getAllLogs,
};
