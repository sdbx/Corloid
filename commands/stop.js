const NODE = {
   timers: require("node:timers")
};
const DISCORD = require("discord.js");
const DISCORD_VOICE = require("@discordjs/voice");

module.exports = {
	data: new DISCORD.SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops the song currently playing."),
   
   /**
    * @param {DISCORD.CommandInteraction} interaction
    */
	async execute(interaction) {
      const { member,
              guild,
              client } = interaction;
      const voiceConnection =
         DISCORD_VOICE.getVoiceConnection(guild.id);
      
      if (voiceConnection === undefined) {
         /* 
          * Note: ${member} is a way to mention the member.
          * (GuildMember objects implement toString() method.)
          */
         await interaction.reply(`${member}.stop >>\n` +
            `Cor bot is not connected to any of the` +
            ` voice channels.`);
         return;
      }

      const voiceChannelId
         = voiceConnection.joinConfig.channelId;

      if (member.voice.channelId !== voiceChannelId) {
         await interaction.reply(`${member}.stop >>\n` +
            `It is necessary for you to be in the voice` +
            ` channel at which Cor bot is.`);
         return;
      }
      if (!guild.available)
         return;

      const player = client.audioPlayer.get(guild.id);
      const musicName
         = client.audioPlayer.musicPool[player.lastChosenMusic];

      player.player.stop();
      if (player.isSingalong)
         NODE["timers"].clearTimeout(player.setTimeoutId);
		await interaction.reply(`${member}.stop >>` +
                              ` ${musicName} has stopped.`);
	}
};