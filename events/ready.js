// Inclusions
const DISCORD = require("discord.js");

// Export
module.exports = {
	name: DISCORD.Events.ClientReady,
	once: true,
   
	execute(client) {
      client.user.setPresence({
         status: "online",
         activities: [{
            name: "삶을 만끽하는 중",
            type: DISCORD.ActivityType.Playing }]});
		console.log(`Ready! Logged in as ${client.user.tag}`);
	}
};