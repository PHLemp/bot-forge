import { ButtonInteraction, CacheType, ChatInputCommandInteraction, Guild, MessageContextMenuCommandInteraction, ModalSubmitInteraction, UserContextMenuCommandInteraction, VoiceState } from "discord.js";
import { CommandRegistry } from "./CommandRegistry";
import { SUPPORT_ROLE_ID } from './model/constants';
import { SecurityManager } from "./SecurityManager";
import { AbstractService } from "./service/AbstractService";
import { BotService } from "./service/BotService";
import { WasteYourTimeService } from "./service/WasteYourTimeService";
import { DiscordUtils } from "./utils/DiscordUtils";
import { LOG_LEVEL, log } from "./utils/LogUtils";

export class Handler {
    private readonly services: AbstractService[];
    private readonly registry: CommandRegistry;

    public constructor(guild: Guild) {
        this.registry = new CommandRegistry();

        this.services = [
            new WasteYourTimeService(),
            new BotService()
        ];

        // Register each service with the registry
        this.services.forEach(service => {
            service.register(this.registry);
        });
    }

    /**
     * Any chat input command will arrive here
     * @param interaction 
     */
    public async handleChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>) {
        log(`Command ${interaction.commandName} received from ${DiscordUtils.getUserNames(interaction.user)}`, LOG_LEVEL.INFO);

        const member = interaction.member;
        if (!member) {
            log("No member found", LOG_LEVEL.WARN);
            return;
        }

        const canAccess = SecurityManager.isPublicCommand(interaction) || (SecurityManager.isInStaff(member.roles) || DiscordUtils.hasRole(member, SUPPORT_ROLE_ID));
        if (!canAccess) {
            log(`User ${DiscordUtils.getUserNames(interaction.user)} tried to use a command without permission`, LOG_LEVEL.WARN);
            interaction.reply({ content: `Non non t'as pas le droit de faire ça ${interaction.user.displayName} ;)`, ephemeral: true });
            return;
        }

        this.registry.handleChatInputCommand(interaction);
    }

    /**
     * Any button interaction will arrive here
     * @param interaction 
     */
    public handleButtonInteraction(interaction: ButtonInteraction) {
        log(`Button ${interaction.customId} received from ${DiscordUtils.getUserNames(interaction.user)}`, LOG_LEVEL.INFO);

        this.registry.handleButtonInteraction(interaction);
    }

    /**
     * Any modal interaction will arrive here
     * @param interaction 
     */
    public handleButtonModal(interaction: ModalSubmitInteraction) {
        log(`Modal ${interaction.customId} received from ${DiscordUtils.getUserNames(interaction.user)}`, LOG_LEVEL.INFO);

        this.registry.handleModalButtonInteraction(interaction);
    }

    /**
     * All user context menu (right click) will arrive here
     * @param interaction 
     */
    public handleUserContextMenu(interaction: UserContextMenuCommandInteraction<CacheType>) {
        log(`User context menu ${interaction.commandName} received from ${DiscordUtils.getUserNames(interaction.user)}`, LOG_LEVEL.INFO);

        this.registry.handleUserContextMenu(interaction);
    }

    /**     
     * All message context menu (right click) will arrive here     
     * @param interaction      
     */
    public handleMessageContextMenu(interaction: MessageContextMenuCommandInteraction<CacheType>) {
        log(`Message context menu ${interaction.commandName} received from ${DiscordUtils.getUserNames(interaction.user)}`, LOG_LEVEL.INFO);

        this.registry.handleMessageContextMenu(interaction);
    }

    public handleVoiceStateChannelUpdate(oldState: VoiceState, newState: VoiceState) {
        this.registry.handleVoiceStateUpdate(oldState, newState);
    }
}