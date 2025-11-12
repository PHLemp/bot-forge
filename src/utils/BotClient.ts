import { Client, GatewayIntentBits, Guild, Partials } from "discord.js";

export class BotClient {
    private static client: Client;
    private static guild: Guild;

    private constructor() { }

    public static getClient() {
        if (!this.client) {
            this.client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent,
                    GatewayIntentBits.GuildMembers,
                    GatewayIntentBits.DirectMessages,
                    GatewayIntentBits.GuildIntegrations,
                    GatewayIntentBits.GuildWebhooks,
                    GatewayIntentBits.GuildScheduledEvents,
                    GatewayIntentBits.GuildEmojisAndStickers,
                    GatewayIntentBits.GuildVoiceStates
                ],
                partials: [Partials.Channel, Partials.User]
            });
        }

        return this.client;
    }

    public static async getGuild() {
        if (!this.guild) {
            this.guild = await this.getClient().guilds.fetch(process.env.GUILD_ID + '');
        }

        return this.guild;
    }
}