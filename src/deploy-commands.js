// Inclusions
const NODE = {
   fs: require("node:fs"),
   path: require("node:path")
};
const DISCORD = require("discord.js");
const CONFIG = require("./config.json");

// Entry point
main();
async function main() {
   const commands = retrieveCommands();
   const rest = new DISCORD.REST().setToken(CONFIG.token);

   try {
      console.log(`Started refreshing ${commands.length}` +
                  ` application (/) commands.`);
      
      const fullRoute
         = DISCORD.Routes
            .applicationCommands(CONFIG.clientId);
      const options = { body: commands };
      const data = await rest.put(fullRoute, options);

      console.log(`Successfully reloaded ${data.length}` +
                  ` application (/) commands.`);
   } catch (error) {
      console.error(error);
   }
}

function retrieveCommands() {
   const commands = [];
   const commandPaths = NODE["path"].join(__dirname, "../commands");
   const commandFiles = NODE["fs"].readdirSync(commandPaths)
                              .filter((file) => file.endsWith('.js'));

   for (const file of commandFiles) {
      const filePath = NODE["path"].join(commandPaths, file);
      const command = require(filePath);

      if ("data" in command && "execute" in command)
         commands.push(command.data.toJSON());
      else
         console.log(`[WARNING] The command at ${filePath}` +
                     ` is missing a required "data" or` +
                     ` "execute" property.`);
   }

   return commands;
}