// Inclusions
const NODE = {
   fs: require("node:fs"),
   path: require("node:path"),
   timers: require("node:timers")
};
const DISCORD = require("discord.js");
const DISCORD_VOICE = require("@discordjs/voice");
const CONFIG = require("./config.json");

// Variables
const AUDIO_PLAYER_STATUS = {
   IDLE: 0,
   PLAY: 1
};

// Export
module.exports = { AUDIO_PLAYER_STATUS,
                   retrieveCommands,
                   retrieveEvents,
                   initAudioPlayer };

/**
 * retrieveCommands()
 * reads slash-command files and retrieves its data.
 * @param {DISCORD.Client} client - A client object to retrieve commands.
 */
function retrieveCommands(client) {
   const commands = new DISCORD.Collection();
   const commandPaths = NODE["path"].join(__dirname, "../commands");
   const commandFiles = NODE["fs"]
                           .readdirSync(commandPaths)
                           .filter((file) => file.endsWith(".js"));
   
   for (const file of commandFiles) {
      const filePath = NODE["path"].join(commandPaths, file);
      const command = require(filePath);

      if ("data" in command && "execute" in command)
         commands.set(command.data.name, command);
      else
         console.log(`[WARNING] The command at ${filePath}` +
                     ` is missing a required "data" or` +
                     ` "execute" property.`);
   }
   client.commands = commands;
}

/**
 * retrieveEvents()
 * reads interaction event handlers and
 * retrieves its data. Add event listeners
 * to `client`.
 * @param {DISCORD.Client} client - A client object to retrieve events.
 */
function retrieveEvents(client) {
   const eventsPath = NODE["path"].join(__dirname, "../events");
   const eventFiles = NODE["fs"].readdirSync(eventsPath)
                                .filter(file => file.endsWith(".js"));

   for (const file of eventFiles) {
      const filePath = NODE["path"].join(eventsPath, file);
      const event = require(filePath);

      if (event.once)
         client.once(event.name,
                     (...args) => event.execute(...args));
      else
         client.on(event.name,
                   (...args) => event.execute(...args));
   }
}

/**
 * initAudioPlayer()
 * initializes the audio player to be used.
 * @param {DISCORD.Client} client - A client object to which
 *    an audio player will be added.
 */
function initAudioPlayer(client) {
   client.audioPlayer = new Map();
   client.audioPlayer.pickRandomMusic = pickRandomMusic;
   client.audioPlayer.printLyrics = printLyrics;
   client.audioPlayer.musicPool
      = NODE["fs"].readdirSync(CONFIG.musicDirectory,
         { recursive: true })
         .filter((file) => 
            file.endsWith(".mp3") || file.endsWith(".wav"));
}

function pickRandomMusic(client, guildId, needNewMusic = false) {
   const player = client.audioPlayer.get(guildId);
   let rand
      = getRandomInt(0, client.audioPlayer.musicPool.length);

   if (needNewMusic
         && player.lastChosenMusic === rand)
      while (rand === player.lastChosenMusic)
         rand = getRandomInt(0, client.audioPlayer.musicPool.length);
   player.lastChosenMusic = rand;

   return {
      music: DISCORD_VOICE
         .createAudioResource(
            NODE["path"].join(
               CONFIG.musicDirectory,
               client.audioPlayer.musicPool[rand]),
            { inlineVolume: true }),
      toString() {
         return client.audioPlayer.musicPool[rand];
      }
   }
}

/**
 * getRandomInt()
 * min inclusive, max exclusive
 * @param {Number} min - minimum
 * @param {Number} max - maximum
 * @return {Number} min <= random number < max
 */
function getRandomInt(min, max) {
   min = Math.ceil(min);
   max = Math.floor(max);
   return Math.floor(Math.random() * (max - min) + min);
}

/**
 * printLyrics()
 * print lyrics of the current playing music.
 * @param {DISCORD_VOICE.AudioPlayer} player - audio player.
 * @param {DISCORD.Channel} channel - a channel to print lyrics.
 * @param {String} musicName - a name of the music.
 */
async function printLyrics(player, channel, musicName) {
   let fileContents;
   
   try {
      musicName = musicName.split(".")[0];
      fileContents = NODE['fs'].readFileSync(
         NODE["path"].join(
            CONFIG.lyricsDirectory,
            (musicName + ".txt")),
         { encoding: "utf-8" });
   } catch {
      await channel.send("No matching lyrics file found.");
      return;
   }

   /* 
    * Note: An example for regexp explanation
    * [00:39] ==> <minute>, <second>
    * 諦めたりなんてしたくはない主義なの  =====\
    * 아키라메타리난테 시타쿠와나이 슈기나노 ====> <text>
    * 포기같은 건 하기 싫은 주의야  =========/
    */
   const pattern  // [^\[] = all characters except [
      = /\[(?<minute>\d{2}):(?<second>\d{2})\]\s*(?<text>[^\[]*)/g;
   const lyrics = [...fileContents.matchAll(pattern)];

   if (lyrics.length === 0) {
      await channel.send("Invalid lyrics format.");
      return;
   }

   let lyricsIndex = 0;
   const messageReference = await channel.send('\0');
   printLogic(messageReference);

   /**
    * @param {DISCORD.Message} msgRef
    */
   function printLogic(msgRef) {
      if (player.state === AUDIO_PLAYER_STATUS.IDLE)
         return;
      if (lyricsIndex === lyrics.length)
         return;
      
      let timeDifference;
      const isFirstLyrics = (lyricsIndex === 0);

      if (isFirstLyrics)
         timeDifference
            = mmss2milsec(lyrics[0].groups.minute,
                          lyrics[0].groups.second);
      else {
         const current = lyrics[lyricsIndex];
         const prev = lyrics[lyricsIndex - 1];
         timeDifference
            =   mmss2milsec(current.groups.minute,
                            current.groups.second)
              - mmss2milsec(prev.groups.minute,
                            prev.groups.second);
      }
      player.setTimeoutId
         = NODE["timers"].setTimeout(async () => {
               msgRef.edit(lyrics[lyricsIndex++].groups.text);
               printLogic(msgRef);
            }, timeDifference);
   }
}

/**
 * mmss2milsec()
 * mm:ss ==> millisecond
 */
function mmss2milsec(mmStr, ssStr) {
   mmStr = Number(mmStr);
   ssStr = Number(ssStr);
   return 1000 * (mmStr * 60 + ssStr);
}