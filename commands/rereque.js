/*
 * rereque.js is as 99% same as request.js,
 * except that pickRandomMusic(~, true).
 * Of course it is possible to make /request
 * command have an option-picker, but I think
 * it is a kind of bothersome to use.
 */

const NODE = {
   timers: require("node:timers"),
   timersPromise: require("node:timers/promises")
};
const DISCORD = require("discord.js");
const DISCORD_VOICE = require("@discordjs/voice");
const { AUDIO_PLAYER_STATUS } = require("../src/corloid_header.js");

module.exports = {
	data: new DISCORD.SlashCommandBuilder()
		.setName("rereque")
		.setDescription("Requests a new song except the last" +
                      " one. (If currently playing, stops.)"),
   
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
         await interaction.reply(`${member}.rereque >>\n` +
            `Cor bot is not connected to any of the` +
            ` voice channels.`);
         return;
      }

      const voiceChannelId
         = voiceConnection.joinConfig.channelId;

      if (member.voice.channelId !== voiceChannelId) {
         await interaction.reply(`${member}.rereque >>\n` +
            `It is necessary for you to be in the voice` +
            ` channel at which Cor bot is.`);
         return;
      }
      if (!guild.available)
         return;

      const player = client.audioPlayer.get(guild.id);

      /*
       * Note: No need to stop the audio player first
       * even if currently playing.
       */
      if (player.state == AUDIO_PLAYER_STATUS.PLAY) {
         NODE["timers"].clearTimeout(player.setTimeoutId);
         /* 
          * Note: Tried to fade-out the music, but the
          * resulting sound is not smooth.
          */
         for (let i = 0; i < 10; i++) {
            const volume = Math.E ** (-6 * (i / 10));
            NODE["timers"].setTimeout(
               () => player.resource.volume.setVolume(volume),
               i * 100);
         }
         await NODE["timersPromise"].scheduler.wait(2000);
      }

      const music = client.audioPlayer
                        .pickRandomMusic(client, guild.id, true);
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
         `${member}.rereque >> Now playing: ${music}.`);
	}
};