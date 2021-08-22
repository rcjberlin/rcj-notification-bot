const request = require("./utils/request");
const fileHelper = require("./utils/file-helper");
const path = require("path");

const scheduleUrlAllTeams = "http://localhost:5000/schedule/json/teams.json";
const filenameChannels = path.join(__dirname, "../channels.json");

const channels = [
  {
    id: 1,
    channel: "General",
  },
  {
    id: 2,
    channel: "Rescue Line",
  },
  {
    id: 3,
    channel: "Rescue Line Entry",
  },
];
const channelIdToStartWithForTeams = 11;

async function main() {
  const response = await request("GET", scheduleUrlAllTeams);
  if (response.status !== 200 || !response.json) {
    console.log("Invalid response", response);
    return;
  }
  const teams = response.json;
  let channelId = channelIdToStartWithForTeams;
  for (const team of teams) {
    channels.push({
      id: channelId++,
      channel: `${team.teamId}: ${team.name}`,
      teamId: team.teamId,
    });
  }
  await fileHelper.writeFile(filenameChannels, JSON.stringify(channels, null, 4));
}
main();
