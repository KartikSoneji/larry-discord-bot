import { handleAutoComplete } from './docs-bot/handle-autocomplete';
import { Guild, Interaction, Client, Intents } from 'discord.js';
import { getCommands, setupCommands } from './common/slashCommands';
import docsCommands from './docs-bot/commands';
import log from 'loglevel';
import dotenv from 'dotenv';
dotenv.config();

log.setLevel(log.levels.INFO);

process.on('unhandledRejection', (error) => {
    log.warn('Unhandled promise rejection:', error);
});

// Create a new discord client
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});

// When the client is ready, run this code (only once)
client.login(process.env.DOCS_BOT_TOKEN);

client.once('ready', async () => {
    log.info('Ready!');
    await main();
});

async function main() {
    if (!client.isReady()) return;
    // const { guilds, commands } = await setupCommands(client, docsCommands);
    const commands = getCommands(docsCommands);
    client.on('interactionCreate', async (interaction: Interaction) => {
        if (interaction.isAutocomplete()) {
            await handleAutoComplete(interaction);
            return;
        }
        if (!interaction.isCommand()) return;

        const command = commands.get(interaction.commandName);

        if (!command) return;
        log.debug(interaction.commandName);
        try {
            await command.execute(interaction);
        } catch (error) {
            log.warn(error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    });
}
