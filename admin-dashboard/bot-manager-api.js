const endpointInput = "input-bot-manager-endpoint";
const tokenInput = "input-bot-manager-token";

function getUrlAndToken() {
  const url = document.getElementById(endpointInput).value;
  const token = document.getElementById(tokenInput).value;
  return { url, token };
}

async function sendRequestToBotManagerAPI(path) {
  const { url, token } = getUrlAndToken();
  const response = await fetch(url + path, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  });
  const data = await response.json();
  if (data.successful) {
    return data.data;
  }
  return {};
}

async function getChannels() {
  sendRequestToBotManagerAPI("/v1/channels");
}
