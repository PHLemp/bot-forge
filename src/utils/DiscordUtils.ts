import { joinVoiceChannel } from '@discordjs/voice';
import { APIInteractionGuildMember, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, Client, Collection, EmbedBuilder, Guild, GuildMember, Message, MessageEditOptions, MessagePayload, ModalSubmitInteraction, PermissionsBitField, TextChannel, User, channelMention, roleMention, userMention } from 'discord.js';
import { ADMIN_BOT_CHANNEL_ID, ADMIN_ROLE_ID, BOT_ADMIN_ROLE_ID, BOT_VOICE_CHANNEL_ID, MODERATOR_CHANNEL_ID, MODERATOR_ROLE_ID, TUTO_COMMANDS_CHANNEL_ID } from '../model/constants';
import { DeleteRoleReasonEnum } from '../model/deleteRoleReasonEnum';
import { BotClient } from './BotClient';
import { LOG_LEVEL, log } from "./LogUtils";
import { TimeUtils } from './TimeUtils';

export class DiscordUtils {

    /**
     * Extracts a Date object from Discord's timestamp format.
     * @param startDateVal - Discord timestamp in format <t:UNIX_NUMBER:FORMAT> or any date string
     * @returns Date object representing the timestamp
     */
    public static extractDate(startDateVal: string | undefined): Date {
        // Discord date format should follow this pattern: <t:UNIX_NUMBER:FORMAT>
        // We need to extract the UNIX_NUMBER and convert it to a Date object
        if (!startDateVal) return new Date();

        const match = startDateVal.match(/<t:(\d+):[tTdDfFR]>/);
        if (match && match[1]) {
            // Convert Unix timestamp (seconds) to milliseconds for Date constructor
            return new Date(parseInt(match[1]) * 1000);
        }

        // If it's not in Discord format, try to parse as regular date string
        const parsedDate = new Date(startDateVal);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }

    private static readonly CHUNK_SIZE = 5;
    private static readonly SLEEP_TIME_FOR_CHUNKS = 8000;

    private constructor() { }

    private static async getTextChannel(channelId: string, guild: Guild): Promise<TextChannel | undefined> {
        const channel = await guild.channels.fetch(channelId)
            .catch(() => log(`Channel ${channelId} not found !!`, LOG_LEVEL.ERROR)) as TextChannel;
        if (!channel) return;

        return channel;
    }

    private static async getMessagesFromLastXSeconds(channel: TextChannel, seconds: number) {
        // Calculer la date limite
        const now = Date.now();
        const timeLimit = now - (seconds * 1000);
        // Récupérer les messages
        const messages = await channel.messages.fetch({ limit: 100 });
        // Filtrer les messages pour ne conserver que ceux envoyés dans les X dernières secondes
        const recentMessages = messages.filter(message => message.createdTimestamp >= timeLimit);

        return recentMessages;
    }

    /**
     * Reply of a msgIdToReply in specified channel.
     * @param msgIdToReply 
     * @param replyContent 
     * @param channel 
     * @param guild 
     * @returns 
     */
    private static async replyInChannel(msgIdToReply: string, replyContent: string, channel: TextChannel): Promise<void> {
        const message = await channel.messages.fetch(msgIdToReply)
            .catch(e => log(`Message ID ${msgIdToReply} not found in ${channel.name} channel. Cause : ${e}`, LOG_LEVEL.ERROR));

        if (!message) {
            log(`Message ID ${msgIdToReply} not found in ${channel.name} channel.`);
            return;
        }

        // Envoyer une réponse à l'auteur du message
        await message.reply(replyContent)
            .catch(
                error => error.code !== 10008 ? // 10008 == unknown message
                    log('Error fetching message:' + error, LOG_LEVEL.ERROR) :
                    null
            );
        log(`Replied to message ID ${msgIdToReply} in channel ${channel.name} with: ${replyContent}`);
    }

    public static async deleteRole(roleId: string, reason: string | DeleteRoleReasonEnum) {
        const guild = await BotClient.getGuild();
        const role = guild.roles.cache.get(roleId);
        if (!role) {
            log(`Role ${roleId} not found`, LOG_LEVEL.ERROR);
            return;
        }
        role.delete(reason).catch((e) => log(`Role ${role.name} not found. Cause : ${e}`, LOG_LEVEL.ERROR));
        log(`Role ${role.name} deleted with reason : ${reason}`);
    }

    public static async deleteRoleFromName(roleName: string, reason: string | DeleteRoleReasonEnum) {
        const guild = await BotClient.getGuild();
        const role = guild.roles.cache.find(role => role.name === roleName);
        if (!role) {
            log(`Role ${roleName} not found`, LOG_LEVEL.WARN);
            return;
        }
        role.delete(reason).catch((e) => log(`Role ${role.name} not found. Cause : ${e}`, LOG_LEVEL.ERROR));
        log(`Role ${role.name} deleted with reason : ${reason}`);
    }

    /**
     * Adds a specific role to all users subscribed to a given event.
     *
     * @param eventId - The unique identifier of the event.
     * @returns A promise that resolves when the role has been added to all subscribers.
     */
    public static async addRoleToAllUsersSubscribedToEvent(eventId: string) {
        DiscordUtils.getEvent(eventId).then(event => {
            const roleName = DiscordUtils.getFormattedRoleName(event?.name || "no-name-event");
            event?.fetchSubscribers({ withMember: true }).then(users => {
                users.forEach(async user => {
                    if (!user.member.roles.cache.some(role => role.name === roleName))
                        DiscordUtils.addRoleToUser(user.member, roleName);
                });
            });
        });
    }

    /**
     * Synchronizes all scheduled events with Discord roles.
     * 
     * This method fetches all scheduled events from the guild and assigns roles to users
     * subscribed to each event. It also removes roles from users who are no longer subscribed
     * to the events.
     * 
     * The process involves:
     * 1. Fetching the guild and its scheduled events.
     * 2. Iterating through each event and fetching its subscribers.
     * 3. Adding a role to each subscriber if they do not already have it.
     * 4. Pausing for a short duration to avoid rate limits.
     * 5. Removing the role from users who are no longer subscribed to the event.
     * 6. Pausing again before moving to the next event.
     * 
     * @returns {Promise<void>} A promise that resolves when all events have been synchronized.
     */
    public static async syncDiscordEvents(): Promise<void> {
        log("Syncing all scheduled events with discord roles...");
        const guild = await BotClient.getGuild();
        const events = await guild.scheduledEvents.fetch();
        for (const event of events.values()) {
            const roleName = DiscordUtils.getFormattedRoleName(event?.name || "no-name-event");
            const allUsers = [];
            let after: string | undefined = undefined;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                // Fetch up to 100 users after the last user ID
                // @ts-expect-error this is shit
                const users = await event.fetchSubscribers({ withMember: true, after });
                allUsers.push(...users.values());

                if (users.size < 100) break; // No more users to fetch

                // Set 'after' to the last user ID fetched
                after = users.last()?.user.id;
            }


            log(`Adding role ${roleName} to all users (${allUsers.length}) subscribed to event ${event.name}`);

            // Add role to all users subscribed to the event
            for (const user of allUsers.values()) {

                if (!user.member.roles.cache.some((role: { name: string; }) => role.name === roleName)) {
                    log(`Adding role ${roleName} to user ${DiscordUtils.getUserNames(user.member)}`);
                    await DiscordUtils.addRoleToUser(user.member, roleName);
                }
            }

            await TimeUtils.sleep(5000);

            // Remove role from all users not subscribed to the event
            const allMembers = await guild.members.fetch();
            for (const member of allMembers.values()) {
                if (!allUsers.find(e => e.user.id == member.id) && member.roles.cache.some(role => role.name === roleName)) {
                    log(`Removing role ${roleName} from user ${DiscordUtils.getUserNames(member)}`);
                    await DiscordUtils.removeRoleToUser(member, roleName);
                }
            }

            await TimeUtils.sleep(30000);
        }
    }

    public static async getRoleByName(roleName: string) {
        return (await BotClient.getGuild()).roles.cache.find(role => role.name === roleName);
    }

    public static async addRoleToUser(member: GuildMember, roleIdentifyer: string) {
        this.addRoleToUsers([member], roleIdentifyer);
    }

    public static async addRoleToUsers(members: GuildMember[] | Collection<string, GuildMember>, roleIdentifier: string) {
        const guild = await BotClient.getGuild();
        let role = guild.roles.cache.find(role => role.name === roleIdentifier || role.id === roleIdentifier);

        if (!role) {
            log(`Role ${roleIdentifier} not found, creation on going...`, LOG_LEVEL.WARN);
            role = await this.createRole(guild, roleIdentifier);
        }

        // Cast Collection into array
        members = members instanceof Collection ? members.map(e => e) : members;

        // Remove members that already have the role
        members = members.filter(member => !member.roles.cache.some(roleOfMember => roleOfMember.name === role.name));

        // Split members into chunks of this.CHUNK_SIZE members each
        for (let i = 0; i < members.length; i += this.CHUNK_SIZE) {
            const batchedMembers = members.slice(i, i + this.CHUNK_SIZE);
            await Promise.all(batchedMembers.map(async member => {
                await member.roles.add(role);
                log(`Role ${roleIdentifier} added to user ${DiscordUtils.getUserNames(member)}`);
            }));

            // Only sleep if there are more members to process
            if (i + this.CHUNK_SIZE < members.length)
                await TimeUtils.sleep(this.SLEEP_TIME_FOR_CHUNKS);
        }
    }

    public static async removeRoleToUser(memberToDelete: GuildMember, roleName: string) {
        this.removeRoleToUsers([memberToDelete], roleName);
    }

    public static async getMax1000kUsers(userIds: string[]): Promise<Collection<string, GuildMember>> {
        const guild = await BotClient.getGuild();
        return await guild.members.fetch({ user: userIds, limit: 1000 });
    }

    public static async removeRoleToUsers(deleteMemberList: GuildMember[], roleIdentifier: string) {
        const guild = await BotClient.getGuild();
        const role = guild.roles.cache.find(role => role.name === roleIdentifier || role.id === roleIdentifier);

        if (!role) {
            log(`Role ${roleIdentifier} not found`, LOG_LEVEL.ERROR);
            return;
        }

        // Cast Collection into array
        deleteMemberList = deleteMemberList instanceof Collection ? deleteMemberList.map(e => e) : deleteMemberList;

        // Remove members that don't have the role
        deleteMemberList = deleteMemberList.filter(member => member.roles.cache.some(roleOfMember => roleOfMember.name === role.name));

        // Split members into chunks of this.CHUNK_SIZE members each
        for (let i = 0; i < deleteMemberList.length; i += this.CHUNK_SIZE) {
            const batchedMembers = deleteMemberList.slice(i, i + this.CHUNK_SIZE);
            await Promise.all(batchedMembers.map(async member => {
                await member.roles.remove(role);
                log(`Role ${roleIdentifier} removed to user ${DiscordUtils.getUserNames(member)}`);
            }));

            // Only sleep if there are more members to process
            if (i + this.CHUNK_SIZE < batchedMembers.length)
                await TimeUtils.sleep(this.SLEEP_TIME_FOR_CHUNKS);
        }
    }

    public static getFormattedRoleName(text: string) {
        return text.toLowerCase().replace(/-/g, " ").replace(/ /g, "-").replace(/-{2,}/g, "-");
    }

    public static async renameRole(oldRoleName: string, newRoleName: string) {
        const guild = await BotClient.getGuild();
        const role = guild.roles.cache.find(role => role.name === oldRoleName);

        if (!role) {
            log(`Role ${oldRoleName} not found`, LOG_LEVEL.ERROR);
            return;
        }

        role.setName(newRoleName);
        log(`Role ${oldRoleName} renamed to ${newRoleName}`);
    }

    public static async createRole(guild: Guild, roleName: string) {
        log(`Creating new role with name "${roleName}"...`);
        try {
            // Check if role name already exist
            const existingRole = guild.roles.cache.find(role => role.name === roleName);
            if (existingRole) {
                log(`Role ${roleName} already exist`, LOG_LEVEL.WARN);
                return existingRole;
            }

            const role = await guild.roles.create({
                name: roleName,
                color: 'Random',
                permissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
            });
            log(`Created new role "${roleName}" with id "${role.id}"`);
            return role;
        } catch (error) {
            log(`Error when trying to create new role : ${error}`, LOG_LEVEL.ERROR);
            throw new Error(`Error when trying to create new role : ${error}`);
        }
    }

    public static async createCategoryChannelWithOneTextAndOneVoiceChannel(guild: Guild, categoryName: string, textChannelName: string, voiceChannelName: string, roleName: string) {
        try {
            const role = guild.roles.cache.find(role => role.name === roleName);

            if (!role) {
                log(`Role ${roleName} not found`, LOG_LEVEL.ERROR);
                throw new Error(`Role ${roleName} not found`);
            }

            const category = await guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: role.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: ADMIN_ROLE_ID,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: BOT_ADMIN_ROLE_ID,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    }
                ]
            });

            const textChannel = await guild.channels.create({
                name: textChannelName,
                type: ChannelType.GuildText,
                parent: category.id,
            });
            textChannel.lockPermissions();

            const vocalChannel = await guild.channels.create({
                name: voiceChannelName,
                type: ChannelType.GuildVoice,
                parent: category.id,
            });
            vocalChannel.lockPermissions();

            return { category, textChannel, vocalChannel };

        } catch (error) {
            log(`Error when trying to create new channels : ${error}`, LOG_LEVEL.ERROR);
            throw new Error(`Error when trying to create new channels : ${error}`);
        }
    }

    public static getAdminBotChannel(client: Client): TextChannel {
        return client.channels.cache.get(ADMIN_BOT_CHANNEL_ID) as TextChannel;
    }

    public static async getTutoBotChannel(client: Client): Promise<TextChannel> {
        const channel = await client.channels.fetch(TUTO_COMMANDS_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
            throw new Error(`Tutorial commands channel ${TUTO_COMMANDS_CHANNEL_ID} not found or is not a text channel`);
        }
        return channel as TextChannel;
    }

    public static async sendEmbededMsg(targetChannel: string, client: Client, embeded: EmbedBuilder, action: ActionRowBuilder<ButtonBuilder> | undefined = undefined, content?: string): Promise<Message<boolean>> {
        const channel = client.channels.cache.get(targetChannel) as TextChannel;

        if (!channel) {
            log(`Channel ${targetChannel} not found`, LOG_LEVEL.ERROR);
            return new Promise<Message<boolean>>(() => { });
        }

        try {
            log(`Sending embeded message "${embeded.data.title}" to channel ${channel.name}...`);
            return action ?
                channel.send({
                    content: content ?? "",
                    embeds: [embeded],
                    components: [action],
                }) :

                channel.send({
                    content: content ?? "",
                    embeds: [embeded]
                });
        } catch (error) {
            log(`Fail to send embeded message !!!\n ${error}`, LOG_LEVEL.ERROR)
            return new Promise(() => { });
        }
    }

    public static async sendEmbededMsgInPM(clientId: string, embeded: EmbedBuilder, action: ActionRowBuilder<ButtonBuilder> | undefined = undefined): Promise<Message<boolean>> {
        const client = BotClient.getClient();
        const user = await client.users.fetch(clientId);

        try {
            log(`Sending embeded message "${embeded.data.title}" to ${user.username}...`);
            return action ?
                user.send({
                    embeds: [embeded],
                    components: [action],
                }) :

                user.send({
                    embeds: [embeded]
                });
        } catch (error) {
            log(`Fail to send embeded message !!!\n ${error}`, LOG_LEVEL.ERROR)
            return new Promise(() => { });
        }
    }

    public static getUserNames(user: User | GuildMember | undefined): string {
        if (!user) {
            return "Unknown user";
        }

        if (user instanceof GuildMember) {
            return `${user.displayName} (${user.user.username} - ${user.id})`;
        }

        return `${user.displayName} (${user.username} - ${user.id})`;
    }

    public static async sendPrivateMsg(userToSend: string | GuildMember, msg: string, client: Client) {
        try {
            const user = userToSend instanceof GuildMember
                ? userToSend.user
                : await client.users.fetch(userToSend);

            log(`Sending message "${msg}" to user ${DiscordUtils.getUserNames(user)}...`);
            await user.send(msg).catch(error =>
                log(`Error sending message (probably because user blocked the BOT or don't allow PM) to user ${DiscordUtils.getUserNames(user)}: ${error}`, LOG_LEVEL.ERROR)
            );
        } catch (error) {
            log(`User (${typeof userToSend === 'string' ? userToSend : userToSend?.id}) not found: ${error}`, LOG_LEVEL.ERROR);
        }
    }

    /**
     * Will reply to the message id.
     * Be carefull, this method is not efficient since it will search
     * the message in the WHOLE discord !!!
     * @param msgIdToReply 
     * @param replyContent 
     * @param guild 
     */
    public static async reply(msgIdToReply: string, replyContent: string, guild: Guild): Promise<void> {
        const channels = guild.channels.cache.filter(channel => channel.isTextBased()) as Map<string, TextChannel>;
        let messageFound = false;

        for (const [, channel] of channels) {
            // Récupérer le message par son ID dans chaque canal
            const message = await channel.messages.fetch(msgIdToReply);
            if (message) {
                // Envoyer une réponse à l'auteur du message
                await message.reply(replyContent)
                    .catch(
                        error => error.code !== 10008 ? // 10008 == unknown message
                            log('Error fetching message:' + error, LOG_LEVEL.ERROR) :
                            null
                    );
                log(`Replied to message ID ${msgIdToReply} in channel ${channel.name} with: ${replyContent}`);
                messageFound = true;
                break;
            }
        }

        if (!messageFound) {
            log(`Message ID ${msgIdToReply} not found in any text channel.`);
        }
    }

    public static async deleteMsg(msgId: string, channelId: string, guild: Guild) {
        const channel = await guild.channels.fetch(channelId)
            .catch(() => log(`Channel ${channelId} not found !!`, LOG_LEVEL.ERROR)) as TextChannel;
        if (!channel) return;

        const message = await channel.messages.fetch(msgId)
            .catch(() => log(`Message ID ${msgId} not found in text channel ${channel.name}`, LOG_LEVEL.WARN));
        if (!message) return;

        await message.delete();
        log(`Message "${message.content}" successfuly deleted in channel ${channel.name}`);
    }

    public static async deleteAllMsgsFromChannel(channelId: string) {
        const guild = await BotClient.getGuild();
        const channel = await guild.channels.fetch(channelId, { force: true })
            .catch(() => log(`Channel ${channelId} not found !!`, LOG_LEVEL.ERROR)) as TextChannel;
        if (!channel) return;

        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size === 0) {
            log(`No messages to delete in channel ${channel.name}`);
            return;
        }

        await channel.bulkDelete(messages);
        log(`Deleted ${messages.size} messages in channel ${channel.name}`);
    }

    public static async deleteLastMessagesFromFewSeconds(channelId: string, guild: Guild, seconds = 120) {
        const channel = await guild.channels.fetch(channelId)
            .catch(() => log(`Channel ${channelId} not found !!`, LOG_LEVEL.ERROR)) as TextChannel;
        if (!channel) return;

        const recentMsg = await this.getMessagesFromLastXSeconds(channel, seconds);

        if (recentMsg.size > 0) {
            await channel.bulkDelete(recentMsg);
            log(`Deleted ${recentMsg.size} messages in channel ${channel.name}`);
        } else {
            log(`No message to delete in channel ${channel.name}`);
        }
    }

    public static async replyOrEditReplyButtonInteraction(interaction: ButtonInteraction, replyContent: string, isEphemeral: boolean = true) {
        interaction.replied ? interaction.editReply(replyContent) : interaction.reply({ content: replyContent, ephemeral: isEphemeral });
    }

    public static async replyOrEditReplyModalSubmitInteraction(interaction: ModalSubmitInteraction, replyContent: string, isEphemeral: boolean = true) {
        interaction.replied ? interaction.editReply(replyContent) : interaction.reply({ content: replyContent, ephemeral: isEphemeral });
    }

    public static async sendMsgByChannelId(
        channelId: string,
        content: string | { embeds?: EmbedBuilder[], components?: ActionRowBuilder<ButtonBuilder>[] },
        guild: Guild
    ): Promise<Message<boolean>> {
        const channel = await this.getTextChannel(channelId, guild);
        if (!channel) return Promise.reject(new Error(`Channel ${channelId} not found`));

        const messageOptions = typeof content === 'string'
            ? { content }
            : content;

        log(`Sending message to channel ${channel.name}...`);
        return await channel.send(messageOptions);
    }

    public static sendReplyMsgById(msgId: string, channelId: string, replyContent: string, guild: Guild) {
        const channel = guild.channels.cache.get(channelId) as TextChannel;
        if (!channel) {
            log(`Channel ${channelId} not found`, LOG_LEVEL.ERROR);
            return;
        }

        const message = channel.messages.cache.get(msgId);
        if (!message) {
            log(`Message ${msgId} not found in channel ${channel.name}`, LOG_LEVEL.ERROR);
            return;
        }

        message.reply(replyContent)
            .catch(error => log(`Error replying to message ${msgId} in channel ${channel.name}: ${error}`, LOG_LEVEL.ERROR));
        log(`Replied to message ${msgId} in channel ${channel.name} with: ${replyContent}`);
    }

    public static async sendMsgByChannel(
        channel: TextChannel,
        content: string | { content?: string, embeds?: EmbedBuilder[], components?: ActionRowBuilder<ButtonBuilder>[] }
    ): Promise<Message<boolean>> {
        const messageOptions = typeof content === 'string'
            ? { content }
            : content;

        log(`Sending message to channel ${channel.name}...`);
        return await channel.send(messageOptions);
    }

    public static async updateMsg(channel: TextChannel, messageId: string, body: string | MessageEditOptions | MessagePayload) {
        const message: Message = await channel.messages.fetch(messageId);
        log(`Updating message "${message.id}" in channel ${channel.name}...`);
        message.edit(body);
    }

    public static async updateEmbededMsg(channel: TextChannel, messageId: string, embeded: EmbedBuilder, components: ActionRowBuilder<ButtonBuilder> | undefined = undefined) {
        const message: Message = await channel.messages.fetch({ force: true, message: messageId });
        log(`Updating message "${message.id}" in channel ${channel.name}...`);
        if (!components) return message.edit({ embeds: [embeded] });
        message.edit({ embeds: [embeded], components: [components] });
    }

    /**
     * Sends a ping to the "Modérateur" role in the specified guild.
     * If the role is found, it sends a message mentioning the role in the moderator channel.
     * If the role is not found, it logs an error message.
     *
     * @param message - The message object from which the guild and channel are derived.
     * @param guild - The guild where the role and channel are located.
     */
    public static sendModoPingInModoChannel(guild: Guild) {
        const mention = this.roleMention(MODERATOR_ROLE_ID);
        DiscordUtils.sendMsgByChannelId(MODERATOR_CHANNEL_ID, mention, guild);
    }

    public static async getChannelTextInfo(channelId: string, guild: Guild): Promise<TextChannel | undefined> {
        const channel = await this.getTextChannel(channelId, guild);
        if (!channel) {
            return undefined;
        }

        return channel;
    }

    public static async connectToAdminChannel() {
        const guild = await BotClient.getGuild();
        log(`Connecting to BOT voice channel (${BOT_VOICE_CHANNEL_ID})...`);
        joinVoiceChannel({
            channelId: BOT_VOICE_CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true,
        });
    }

    public static isTextChannel(channel: any): channel is TextChannel {
        return !!channel["name"];
    }

    public static userMention(userId?: string) {
        if (!userId) return "Inconnu";
        return userMention(userId);
    }

    public static roleMention(roleId: string) {
        return roleMention(roleId);
    }

    public static channelMention(channelId: string) {
        return channelMention(channelId);
    }

    public static async getEvent(eventId: string) {
        const guild = await BotClient.getGuild();
        const events = await guild.scheduledEvents.fetch();
        return events.get(eventId);
    }

    public static createButton(buttonId: string, buttonName: string, buttonColor: ButtonStyle, disabled: boolean = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(buttonId)
                .setLabel(buttonName)
                .setStyle(buttonColor)
                .setDisabled(disabled)
        );
    }

    public static createButtons(buttons: { id: string, name: string, style: ButtonStyle, disabled?: boolean }[]): ActionRowBuilder<ButtonBuilder> {
        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        buttons.forEach(button => {
            const newButton = new ButtonBuilder()
                .setCustomId(button.id)
                .setLabel(button.name)
                .setStyle(button.style)
                .setDisabled(button.disabled ?? false);
            actionRow.addComponents(newButton);
        });
        return actionRow;
    }

    public static hasRole(member: GuildMember | APIInteractionGuildMember | null, roleId: string) {
        if (!member) return false;
        return Array.isArray(member.roles) ? member.roles.includes(roleId) : member.roles.cache.has(roleId);
    }

    public static getEmbed() {
        return new EmbedBuilder();
    }

    public static extractUserMention(value: string | undefined): any {
        return value?.replace(/<@|>/g, '');
    }

    public static extractChannelId(voiceChannelMention: string | undefined) {
        return voiceChannelMention?.replace(/<#|>/g, '');
    }

    /**
     * Formats a timestamp for Discord's time formatting.
     * @param dateNumber - Unix timestamp in seconds
     * @param format - Discord time format:
     *   t = Short time (e.g., 9:30 AM)
     *   T = Long time (e.g., 9:30:00 AM)
     *   d = Short date (e.g., 07/01/2021)
     *   D = Long date (e.g., July 1, 2021)
     *   f = Short date/time (e.g., July 1, 2021 9:30 AM)
     *   F = Long date/time (e.g., Thursday, July 1, 2021 9:30 AM)
     *   R = Relative time (e.g., 2 hours ago)
     * @returns Formatted Discord timestamp string
     */
    public static getDate(dateNumber: Date, format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'): string {
        return `<t:${Math.floor(dateNumber.getTime() / 1000)}:${format}>`;
    }
}