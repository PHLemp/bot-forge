/* eslint-disable @typescript-eslint/no-unused-vars */
import { ButtonInteraction, CacheType, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, ModalSubmitInteraction, UserContextMenuCommandInteraction, VoiceState } from "discord.js";
import { CommandRegistry } from "../CommandRegistry";
import { log, LOG_LEVEL } from "../utils/LogUtils";

export abstract class AbstractService {

    /**
     * Register the service with the command registry.
     * @param registry The command registry
     */
    abstract register(registry: CommandRegistry): void

    /**
     * Called when a command is received from chat command.
     * You need to check if command name is the one you want to handle.
     * @param interaction The command interaction
     */
    handleChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>): void {
        log(`handleChatInputCommand not implemented for ${this.constructor.name} with command name ${interaction.commandName}`, LOG_LEVEL.WARN);
        return;
    }

    /**
     * Called when a button interaction is received.
     * You need to check if customId is the one you want to handle.
     * @param interaction The button interaction
     */
    handleButtonInteraction(interaction: ButtonInteraction): void {
        log(`handleButtonInteraction not implemented for ${this.constructor.name} with customId ${interaction.customId}`, LOG_LEVEL.WARN);
        return;
    }

    /**
     * Called when a modal interaction is received.
     * You need to check if customId is the one you want to handle.
     * @param interaction The modal interaction
     */
    handleButtonModal(interaction: ModalSubmitInteraction): void {
        log(`handleButtonModal not implemented for ${this.constructor.name} with customId ${interaction.customId}`, LOG_LEVEL.WARN);
        return;
    }

    /**
     * Called when a user context menu interaction is received.
     * You need to check if command name is the one you want to handle.
     * @param interaction The user context menu interaction
     */
    handleUserContextMenu(interaction: UserContextMenuCommandInteraction<CacheType>): void {
        log(`handleUserContextMenu not implemented for ${this.constructor.name} with command name ${interaction.commandName}`, LOG_LEVEL.WARN);
        return;
    }

    /**
     * Called when a message context menu interaction is received.
     * You need to check if command name is the one you want to handle.
     * @param interaction The message context menu interaction
     */
    handleMessageContextMenu(interaction: MessageContextMenuCommandInteraction<CacheType>): void {
        log(`handleMessageContextMenu not implemented for ${this.constructor.name} with command name ${interaction.commandName}`, LOG_LEVEL.WARN);
        return;
    }

    /**
     * Called when someone connects or disconnects from a voice channel.
     * You need to check if the channel is the one you want to handle.
     * @param oldState The old voice state
     * @param newState The new voice state
     */
    handleChannelConnection(oldState: VoiceState, newState: VoiceState): void {
        log(`handleChannelConnection not implemented for ${this.constructor.name} with channel id ${oldState.channelId}`, LOG_LEVEL.WARN);
        return;
    }
}