const NODE = {
   timersPromise: require("node:timers/promises")
};
const DISCORD = require("discord.js");
const DISCORD_VOICE = require("@discordjs/voice");
const { AUDIO_PLAYER_STATUS } = require("../src/corloid_header.js");

module.exports = {
	data: new DISCORD.SlashCommandBuilder()
		.setName("request")
		.setDescription("Plays a song randomly picked."),
   
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
         await interaction.reply(`${member}.request >>\n` +
            `Cor bot is not connected to any of the` +
            ` voice channels.`);
         return;
      }

      const voiceChannelId
         = voiceConnection.joinConfig.channelId;

      if (member.voice.channelId !== voiceChannelId) {
         await interaction.reply(`${member}.request >>\n` +
            `It is necessary for you to be in the voice` +
            ` channel at which Cor bot is.`);
         return;
      }
      if (!guild.available)
         return;

      const player = client.audioPlayer.get(guild.id);

      if (player.state === AUDIO_PLAYER_STATUS.PLAY) {
         await interaction.reply(
            `${member}.request >> Already playing a music.`);
         return;
      }

      const music = client.audioPlayer
                        .pickRandomMusic(client, guild.id);
      const responseResult = await interaction.deferReply();
      const latency
         = responseResult.createdTimestamp
           - interaction.createdTimestamp;

      if (player.isSingalong)
         client.audioPlayer.printLyrics(
            player,
            player.lyricsPrintChannel,
            music.toString());
      await NODE["timersPromise"].scheduler.wait(latency);
      player.player.play(music.music);
      player.resource = music.music;
      await interaction.editReply(
         `${member}.request >> Now playing: ${music}.`);
	}
};