// Inclusions
const DISCORD = require("discord.js");
const DISCORD_VOICE = require("@discordjs/voice");
const { AUDIO_PLAYER_STATUS } = require("../src/corloid_header.js");

// Export
module.exports = {
	data: new DISCORD.SlashCommandBuilder()
		.setName("invite")
		.setDescription("Invites Cor bot to a voice channel" +
                      " where the caller locates."),
   
   /**
    * @param {DISCORD.CommandInteraction} interaction
    */
	async execute(interaction) {
      const { member,
              client,
              guild } = interaction;
      const voiceChannelId = member.voice.channelId;
      
      if (voiceChannelId == null) {
         /* 
          * Note: ${member} is a way to mention the member.
          * (GuildMember objects implement toString() method.)
          */
         await interaction.reply(`${member}.invite >>\n` +
            `It is necessary for you to be in any voice` +
            ` channels in order to invite Cor bot there.`);
         return;
      }
      if (!guild.available)
         return;
      
      // If none, initialize a guild-specific audio player.
      if (client.audioPlayer.get(guild.id) === undefined) {
         client.audioPlayer.set(guild.id, {
            player: DISCORD_VOICE.createAudioPlayer({
               behaviors: { noSubscriber:
                  DISCORD_VOICE.NoSubscriberBehavior.Stop }}),
            state: AUDIO_PLAYER_STATUS.IDLE,
            isSingalong: false,
            lyricsPrintChannel: null,
            lastChosenMusic: 0,
            resource: null,
            setTimeoutId: null });

         const player = client.audioPlayer.get(guild.id);

         player.player.on(DISCORD_VOICE.AudioPlayerStatus.Playing,
            () => player.state = AUDIO_PLAYER_STATUS.PLAY);
         player.player.on(DISCORD_VOICE.AudioPlayerStatus.Idle,
            () => player.state = AUDIO_PLAYER_STATUS.IDLE);
      }

      /* 
       * Note: If a new call of joinVoiceChannel() happens
       * while Cor bot is already in another voice channel,
       * the existing voice connection will then switches to
       * it. Therefore, no need to destroy the existing con-
       * nection and create a new one.
       * (Refer to: https://discordjs.guide/voice/)
       * 
       * Note: It is the best practice not to track
       * the voice connection. (Refer to the above link.)
       * Instead, it is possible to get the reference of it
       * by calling getVoiceConnection(guildId).
       */
      const voiceConnection = DISCORD_VOICE.joinVoiceChannel({
         channelId: voiceChannelId,
         guildId: guild.id,
         adapterCreator: guild.voiceAdapterCreator });
      const player = client.audioPlayer.get(guild.id);
      
      voiceConnection.subscribe(player.player);

      /* 
       * Note: Channel mention
       * ==> <#channelId> or
       * ==> channel objects implementing toString
       */
      await interaction.reply(`${member}.invite >>\n` +
               `Cor bot has entered to <#${voiceChannelId}>.`);
	}
};