// Inclusions
const DISCORD = require("discord.js");
const DISCORD_VOICE = require("@discordjs/voice");

// Export
module.exports = {
	data: new DISCORD.SlashCommandBuilder()
		.setName("kick")
		.setDescription("Makes Cor bot to leave the voice" +
                      "channel where the caller locates."),
   
   /**
    * @param {DISCORD.CommandInteraction} interaction
    */
	async execute(interaction) {
      const { member,
              client,
              guild } = interaction;
      const voiceConnection =
         DISCORD_VOICE.getVoiceConnection(guild.id);
      
      if (voiceConnection === undefined) {
         /* 
          * Note: ${member} is a way to mention the member.
          * (GuildMember objects implement toString() method.)
          */
         await interaction.reply(`${member}.kick >>\n` +
            `Cor bot is not connected to any of the` +
            ` voice channels.`);
         return;
      }

      const voiceChannelId
         = voiceConnection.joinConfig.channelId;

      if (member.voice.channelId !== voiceChannelId) {
         await interaction.reply(`${member}.kick >>\n` +
            `It is necessary for you to be in the voice` +
            ` channel at which Cor bot is.`);
         return;
      }
      if (!guild.available)
         return;

      const player = client.audioPlayer.get(guild.id);
      
      player.player.stop();
      voiceConnection.destroy();
      /* 
       * Note: Channel mention
       * ==> <#channelId> or
       * ==> channel objects implementing toString
       */
      await interaction.reply(`${member}.kick >>` +
         ` Cor bot has left` +
         ` <#${voiceChannelId}>.`);
	}
};