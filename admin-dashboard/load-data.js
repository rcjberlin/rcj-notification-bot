async function loadData() {
    const [channels, users] = await Promise.all([getChannels(), getUsers()]);
    fillChannelsTable(channels, users);
    fillUsersPerMessengerBotTable(users);
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
}

function showChannelDetails(channelId, channelName) {
    document.getElementById("channel-detail").classList.remove("hidden");
    document.getElementById("channel-detail-name").textContent = channelName;
    // TODO: fetch sent messages + update channelId for send-button
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
