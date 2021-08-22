let globalChannelData = {};
let channelIdForSendButton = null;

async function loadData() {
    const [channels, users, messages] = await Promise.all([getChannels(), getUsers(), getMessages()]);
    fillChannelsTable(channels, users);
    fillUsersPerMessengerBotTable(users);
    fillMessagesTable(messages);
}

function fillChannelsTable(channels, users) {
    const channelMap = {};
    const tableNode = document.getElementById("channel-table");
    for (const channel of channels) {
        const row = tableNode.insertRow();
        const cellChannel = row.insertCell();
        const cellSubscribers = row.insertCell();
        const linkToChannelDetails = document.createElement("a");
        linkToChannelDetails.textContent = channel.channel;
        linkToChannelDetails.href = "#channel-detail";
        linkToChannelDetails.onclick = () => { showChannelDetails(channel.id, channel.channel) };
        cellChannel.appendChild(linkToChannelDetails);
        cellSubscribers.textContent = 0;
        channelMap[channel.id] = { totalSubscribers: 0, tableCell: cellSubscribers };
        globalChannelData[channel.id] = { channel, messages: [] };
    }
    for (const bot in users) {
        for (const channelId in users[bot].channels) {
            channelMap[channelId].totalSubscribers += users[bot].channels[channelId];
        }
    }
    for (const channel of Object.values(channelMap)) {
        if (channel.totalSubscribers > 0) {
            channel.tableCell.textContent = channel.totalSubscribers;
        }
    }

    document.getElementById("channel-detail-btn-send-message").addEventListener("click", sendMessageToSelectedChannel);
}

function showChannelDetails(channelId, channelName) {
    document.getElementById("channel-detail").classList.remove("hidden");
    document.getElementById("channel-detail-name").textContent = channelName;

    // clear sent-messages table and fill with messages for selected channel
    const tableNode = document.getElementById("channel-detail-sent-messages");
    const numberOfRowsToDelete = tableNode.rows.length-1;
    for (let i=0; i<numberOfRowsToDelete; i++) {
        tableNode.deleteRow(-1);
    }

    const channel = globalChannelData[channelId];
    for (const message of channel.messages) {
        insertMessageRow(tableNode, message, 1);
    }

    channelIdForSendButton = channelId;
}

async function sendMessageToSelectedChannel() {
    if (channelIdForSendButton === null) return;
    const messageInput = document.getElementById("channel-detail-send-message-input");
    const message = messageInput.value;
    if (!message) return;
    const sentMessage = await sendMessage(message, [channelIdForSendButton]);
    insertMessageRow(document.getElementById("channel-detail-sent-messages"), sentMessage, 1, true);
    messageInput.value = "";
    messageInput.dispatchEvent(new Event('input')); // trigger event so that value is synced with LS
}

function fillUsersPerMessengerBotTable(users) {
    const tableNode = document.getElementById("stats-users-per-messenger");
    for (const bot in users) {
        const row = tableNode.insertRow();
        const cellBot = row.insertCell();
        const cellUsers = row.insertCell();
        cellBot.textContent = bot;
        cellUsers.textContent = users[bot].total || 0;
    }
}

function fillMessagesTable(messages) {
    // assumes that fillChannelsTable is executed before and globalChannelData is correctly initialized there
    const tableNode = document.getElementById("messages-table");
    for (const message of messages) {
        // currently assumes that messages are already ordered from oldest to latest
        insertMessageRow(tableNode, message, 1, true); // insert as second row, so that we reverse the order of messages
    }
}

function insertMessageRow(tableNode, message, position=1, pushMessageToChannelMessages=false) {
    const row = tableNode.insertRow(position);
    const [cellChannels, cellTimestamp, cellRecipients, cellMessage] = Array(4).fill(1).map(() => row.insertCell());
    let channelString = "";
    for (const channelId of message.channelIds) {
        if (channelString.length > 0) channelString += ", ";
        channelString += globalChannelData[channelId].channel.channel;
        if (pushMessageToChannelMessages) {
            globalChannelData[channelId].messages.push(message);
        }
    }
    cellChannels.textContent = channelString;
    cellTimestamp.textContent = convertDateToString((new Date(message.timestamp).getTime()/1000));
    cellRecipients.textContent = message.users;
    cellMessage.textContent = message.message;
}
