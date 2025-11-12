import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
import { WASTE_YOUR_TIME_INPUT } from './model/constants';
import { WasteYourTimeService } from './service/WasteYourTimeService';
import { LOG_LEVEL, log } from './utils/LogUtils';

dotenv.config();

// Refresh commands on Discord server
// npx ts-node src/register-commands.ts

const commands = [
    new SlashCommandBuilder()
        .setName(WasteYourTimeService.COMMAND_WASTE_YOUR_TIME)
        .setDescription("Utilise la dernière technologie d'IA pour répondre aux questions")
        .addStringOption(option =>
            option
                .setName(WASTE_YOUR_TIME_INPUT)
                .setDescription("Demande moi quelque chose. N'importe quoi.")
                .setRequired(true)
        )].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        log("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
            { body: commands },
        );

        log("Successfully reloaded application (/) commands.");
    } catch (error) {
        log((error as Error).message, LOG_LEVEL.ERROR);
    }
})();
