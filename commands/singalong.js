const DISCORD = require("discord.js");
const DISCORD_VOICE = require("@discordjs/voice");

module.exports = {
	data: new DISCORD.SlashCommandBuilder()
		.setName("singalong")
		.setDescription("Sets to print the lyrics of its matching song" +
                      " to a specific channel.")
      .addSubcommand((subcommand) =>
         subcommand
            .setName("on")
            .setDescription("Activate the singalong mode.")
            .addChannelOption((option) =>
               option
                  .setName("channel")
                  .setDescription("a channel to print the lyrics.")
                  .setRequired(true)))
      .addSubcommand((subcommand) =>
         subcommand
            .setName("off")
            .setDescription("Deactivate the singalong mode.")),
   
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
         await interaction.reply(`${member}.singalong >>\n` +
            `Cor bot is not connected to any of the` +
            ` voice channels.`);
         return;
      }

      const voiceChannelId
         = voiceConnection.joinConfig.channelId;

      if (member.voice.channelId !== voiceChannelId) {
         await interaction.reply(`${member}.singalong >>\n` +
            `It is necessary for you to be in the voice` +
            ` channel at which Cor bot is.`);
         return;
      }
      if (!guild.available)
         return;

      const player = client.audioPlayer.get(guild.id);

      if (interaction.options.getSubcommand() === "on") {
         const channel = interaction.options.getChannel("channel");
         player.isSingalong = true;
         player.lyricsPrintChannel = channel;
         await interaction.reply(`${member}.singalong >> ON @ ${channel}` +
                                 ` (Applied from the next music.)`);
      }
      // getSubcommand() === 'off'
      else {
         player.isSingalong = false;
         await interaction.reply(`${member}.singalong >> OFF` +
                                 ` (Applied from the next music.)`);
      }
	}
};