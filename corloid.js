// Inclusions
const DISCORD = require("discord.js");
const CONFIG = require("./src/config.json");
const { retrieveCommands,
        retrieveEvents,
        initAudioPlayer } = require("./src/corloid_header.js");

// Entry point
// Note: node -v ==> v20.5.0
main();
function main() {
   const client = new DISCORD.Client({
      intents: [DISCORD.GatewayIntentBits.Guilds,
                DISCORD.GatewayIntentBits.GuildVoiceStates] });
   
   retrieveCommands(client);
   retrieveEvents(client);
   initAudioPlayer(client);
   client.login(CONFIG.token);
}