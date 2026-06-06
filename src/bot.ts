// Main file
import {
    Events,
    Guild,
    Interaction,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { Handler } from './Handler';
import { REDFIELD_ID } from './model/constants';
import { BotClient } from './utils/BotClient';
import { DiscordUtils } from './utils/DiscordUtils';
import { log, LOG_LEVEL } from './utils/LogUtils';
import { TimeUtils } from './utils/TimeUtils';

// Charger les variables d'environnement
dotenv.config();
// Représente le BOT
export const client = BotClient.getClient();
// Représente le serveur Discord
export let guild: Guild;
// Représente le gestionnaire d'événements et de commandes
let handler: Handler;

// Lorsque le bot s'est initialisé
client.once(Events.ClientReady, async () => {
    log('Bot is online!');

    client.user?.setStatus('online');
    guild = await BotClient.getGuild();
    handler = new Handler(guild);

    executeAtStart();
});

async function executeAtStart() {
    //DiscordUtils.connectToChannel(BOT_VOICE_CHANNEL_ID);
    DiscordUtils.sendPrivateMsg(REDFIELD_ID, DiscordUtils.getDate(new Date(), "f") + " - ALIVE !", client);
}

// Écouter les messages
client.on(Events.MessageCreate, async message => {
    // Ignorer les messages provenant du bot lui-même
    if (message.author.bot) return;

    let channelName = "UNKNOW NAME";

    if (DiscordUtils.isTextChannel(message.channel)) {
        channelName = message.channel.name;
    }

    log(`New message in '${channelName}' from '${message.author.displayName}' --> ${message.content}`);
});

// Écouter les interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    log(`New interaction from '${interaction.user.displayName}'`);
    if (interaction.isChatInputCommand()) {
        handler.handleChatInputCommand(interaction);
    } else if (interaction.isButton()) {
        handler.handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
        handler.handleButtonModal(interaction);
    } else if (interaction.isUserContextMenuCommand()) {
        handler.handleUserContextMenu(interaction);
    } else if (interaction.isMessageContextMenuCommand()) {
        handler.handleMessageContextMenu(interaction);
    }
});

// Un event vient d'être créé
client.on(Events.GuildScheduledEventCreate, async (guildScheduledEvent) => {
});

// Un événement programmé est supprimé
client.on(Events.GuildScheduledEventDelete, async (guildScheduledEvent) => {
});

// L'événement programmé est mis à jour
client.on(Events.GuildScheduledEventUpdate, async (oldEvent, updatedEvent) => {
});

// Quelqu'un se connecte ou se déconnecte d'un canal vocal
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    handler.handleVoiceStateChannelUpdate(oldState, newState);
});

// Quelqu'un vient d'indiquer qu'il est intéressé par un event
client.on(Events.GuildScheduledEventUserAdd, async (guildScheduledEvent, userId) => {
});

// Quelqu'un vient d'indiquer qu'il n'est plus intéressé par un event
client.on(Events.GuildScheduledEventUserRemove, async (guildScheduledEvent, userId) => {
});

// Will proc when the bot is calling too much the discord API
client.rest.on('rateLimited', (info) => {
    log(`Rate limit hit. You need to wait ${TimeUtils.returnHoursMinutesSecondsFromMilliseconds(info.timeToReset)}`, LOG_LEVEL.WARN);
});

// Handle any uncaught exception to avoid crash
process.on('uncaughtException', (err) => {
    log(`Uncaught Exception thrown --> ${err.stack || err}`, LOG_LEVEL.ERROR);
    return;
});

// Handle any unhandled rejection to avoid crash
process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason instanceof Error ? reason.stack : reason}`, LOG_LEVEL.ERROR);
    promise.catch((err) => {
        log(`Caught promise error --> ${err.stack || err}`, LOG_LEVEL.ERROR);
    });
    return;
});

// Se connecter au serveur avec le bot en utilisant le token du serveur
client.login(process.env.DISCORD_TOKEN);