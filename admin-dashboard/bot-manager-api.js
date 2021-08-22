const endpointInput = "input-bot-manager-endpoint";
const tokenInput = "input-bot-manager-token";

function getUrlAndToken() {
  const url = document.getElementById(endpointInput).value;
  const token = document.getElementById(tokenInput).value;
  return { url, token };
}

async function sendRequestToBotManagerAPI(path, options = {}) {
  const { url, token } = getUrlAndToken();
  const defaultValue = "defaultValue" in options ? options.defaultValue : {};
  if (!token) return defaultValue;
  const response = await fetch(url + path, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    ...(options && options.body ? { body: options.body } : {}),
  });
  const data = await response.json();
  if (data.successful) {
    return data.data;
  }
  return defaultValue;
}

function getChannels() {
  return sendRequestToBotManagerAPI("/v1/channels", { defaultValue: [] });
}

function getUsers() {
  return sendRequestToBotManagerAPI("/v1/users");
}

function getMessages() {
  return sendRequestToBotManagerAPI("/v1/messages", { defaultValue: [] });
}

function sendMessage(message, channelIds) {
  return sendRequestToBotManagerAPI("/v1/send", {
    method: "POST",
    body: JSON.stringify({
      message,
      channelIds,
    }),
  });
}
