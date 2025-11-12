import { ActionRowBuilder, CacheType, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle, ThreadAutoArchiveDuration } from "discord.js";
import { CommandRegistry } from "../CommandRegistry";
import { BotClient } from '../utils/BotClient';
import { log, LOG_LEVEL } from "../utils/LogUtils";
import { AbstractService } from "./AbstractService";

export class BotService extends AbstractService {

    public static readonly COMMAND_BOT_REPLY = "reply-bot";
    public static readonly COMMAND_BOT_REPLY_CHANNEL = "channel";
    public static readonly COMMAND_BOT_REPLY_MESSAGE = "message";
    public static readonly COMMAND_BOT_REPLY_MESSAGE_ID = "message-id";
    public static readonly COMMAND_BOT_REPLY_FROM_MESSAGE = "Je réponds !";

    // You should not update this number manually, it's used to generate unique IDs for modals
    private modalIdNumber = 0;
    private modalId = `bot-modal-response-${this.modalIdNumber++}`;

    public register(registry: CommandRegistry): void {
        registry.registerChatCommand(BotService.COMMAND_BOT_REPLY, this);
        registry.registerMessageContextMenu(BotService.COMMAND_BOT_REPLY_FROM_MESSAGE, this);
    }

    public handleChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>): void {
        if (interaction.commandName === BotService.COMMAND_BOT_REPLY) {
            this.sendBotReplyMsg(interaction);
        }
    }

    public handleMessageContextMenu(interaction: MessageContextMenuCommandInteraction<CacheType>): void {
        if (interaction.commandName === BotService.COMMAND_BOT_REPLY_FROM_MESSAGE) {
            this.sendBotReplyMsgFromContextMenu(interaction);
        }
    }

    public async syncForum(sourceForumChannelId: string, targetForumChannel: string): Promise<void> {
        log(`Starting forum sync from ${sourceForumChannelId} to ${targetForumChannel}`, LOG_LEVEL.INFO);

        // Fetch every existing posts from the source Thread Channel and create them in the target Thread Channel.
        // Copy every message from the source forum in every "to" post forums.
        const sourceThread = BotClient.getClient().channels.cache.get(sourceForumChannelId);
        const targetThread = BotClient.getClient().channels.cache.get(targetForumChannel);

        const allThreads = [];

        if (!sourceThread || !targetThread) {
            log("Invalid thread channel IDs provided", LOG_LEVEL.WARN);
            return;
        }

        if (!sourceThread.isThreadOnly() || !targetThread.isThreadOnly()) {
            log("Provided channel IDs are not thread channels", LOG_LEVEL.WARN);
            return;
        }

        // Récupérer les threads actifs
        const activeThreads = await sourceThread.threads.fetchActive();
        allThreads.push(...activeThreads.threads.values());

        const archivedThreads = await sourceThread.threads.fetchArchived();
        allThreads.push(...archivedThreads.threads.values());

        allThreads.forEach(async (thread) => {
            log(`Syncing thread: ${thread.name}`, LOG_LEVEL.INFO);
            let fetchedMessages = await thread.messages.fetch();
            const firstMessage = await thread.fetchStarterMessage();

            // Extract attachments from the first message
            const startingMessageAttachments = firstMessage?.attachments
                ? Array.from(firstMessage.attachments.values()).map(att => att.url)
                : [];

            // Créer un nouveau thread dans le canal cible
            const newThread = await targetThread.threads.create({
                message: {
                    content: firstMessage?.content || 'No starter message content',
                    files: startingMessageAttachments
                },
                name: thread.name,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                reason: `Syncing thread from ${thread.id}`,
            });

            // Trier les messages par ordre chronologique (premier = plus ancien)
            fetchedMessages = fetchedMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            let lastAuthorName = '';

            // Copier tous les messages du thread source vers le nouveau thread
            for (const message of fetchedMessages) {
                const msg = message[1];
                // Skip the first message as it's already copied
                if (msg.id === firstMessage?.id) continue;

                // Extract attachment URLs
                const attachments = msg.attachments
                    ? Array.from(msg.attachments.values()).map(att => att.url)
                    : [];

                await newThread.send({
                    content: msg.content ? (lastAuthorName != msg.author.displayName ? `[Message de **${msg.author.displayName}**]\n` : '') + msg.content : '',
                    embeds: msg.embeds,
                    components: msg.components,
                    files: attachments
                });

                lastAuthorName = msg.author.displayName;
            }
        });
    }

    private sendBotReplyMsgFromContextMenu(interaction: MessageContextMenuCommandInteraction<CacheType>) {
        const modal = new ModalBuilder()
            .setCustomId(this.modalId)
            .setTitle('Je dis quoi ?');

        const replyInput = new TextInputBuilder()
            .setCustomId('reply-content')
            .setLabel('Donne moi mon texte...')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Écris ton message ici...')
            .setRequired(true)
            .setMaxLength(1024);

        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(replyInput);
        modal.addComponents(firstActionRow);

        interaction.showModal(modal);

        // Create a collector to wait for the modal submission
        const filter = (i: ModalSubmitInteraction) =>
            i.customId === this.modalId && i.user.id === interaction.user.id;

        interaction.awaitModalSubmit({ filter, time: 60000 })
            .then(async modalInteraction => {
                const replyContent = modalInteraction.fields.getTextInputValue('reply-content');

                await modalInteraction.deferReply({ ephemeral: true });

                try {
                    const targetMessage = interaction.targetMessage;
                    await targetMessage.reply(replyContent);
                    modalInteraction.editReply({ content: "Reply sent successfully!" });
                } catch (error) {
                    log(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`, LOG_LEVEL.ERROR);
                    modalInteraction.editReply({ content: `Une erreur s'est produite: ${error instanceof Error ? error.message : 'Erreur inconnue'}` });
                }
            })
            .catch(error => {
                if (error.code === 'InteractionCollectorError') {
                    log("Modal timed out", LOG_LEVEL.WARN);
                } else {
                    log(`Error with modal: ${error}`, LOG_LEVEL.ERROR);
                }
            });
    }

    private sendBotReplyMsg(interaction: ChatInputCommandInteraction<CacheType>): void {
        log(`Command ${BotService.COMMAND_BOT_REPLY} received from ${interaction.user.tag}`, LOG_LEVEL.INFO);

        const channelParam = interaction.options.getChannel(BotService.COMMAND_BOT_REPLY_CHANNEL);
        const messageId = interaction.options.getString(BotService.COMMAND_BOT_REPLY_MESSAGE_ID);
        const message = interaction.options.getString(BotService.COMMAND_BOT_REPLY_MESSAGE);

        if (!channelParam || !messageId || !message) {
            interaction.reply({ content: "Il manque des informations pour répondre au message.", ephemeral: true });
            return;
        }

        const client = BotClient.getClient();

        // Defer the reply to give us time to process
        interaction.deferReply({ ephemeral: true }).then(async () => {
            try {
                // Try to get channel from cache first, then fetch if not found
                let channel = client.channels.cache.get(channelParam.id);
                if (!channel) {
                    channel = (await client.channels.fetch(channelParam.id))!;
                }

                if (!channel || !channel.isTextBased()) {
                    return interaction.editReply("Le canal spécifié n'est pas valide ou n'est pas un canal textuel.");
                }

                // Try to get message from cache first, then fetch if not found
                let targetMessage = channel.messages.cache.get(messageId);
                if (!targetMessage) {
                    targetMessage = await channel.messages.fetch(messageId);
                }

                await targetMessage.reply(message);
                return interaction.editReply("Message envoyé avec succès!");

            } catch (error) {
                log(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return interaction.editReply(`Une erreur s'est produite: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
        });
    }
}