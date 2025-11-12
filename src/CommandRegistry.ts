import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction,
    VoiceState
} from "discord.js";
import { AbstractService } from "./service/AbstractService";
import { log, LOG_LEVEL } from "./utils/LogUtils";

/**
 * CommandRegistry is responsible for managing and routing various types of commands and interactions
 * within the Discord bot. It allows services to register handlers for chat commands, buttons, modals,
 * user context menus, message context menus, and voice state updates.
 * 
 * Each type of command or interaction is stored in a separate collection, allowing for efficient routing
 * and handling of interactions based on their type and identifier.
 */
export class CommandRegistry {
    private chatCommandHandlers: Map<string, AbstractService[]> = new Map();
    private buttonHandlers: Map<string, AbstractService[]> = new Map();
    private buttonPrefixHandlers: Map<string, AbstractService[]> = new Map();
    private modalHandlers: Map<string, AbstractService[]> = new Map();
    private userContextMenuHandlers: Map<string, AbstractService[]> = new Map();
    private messageContextMenuHandlers: Map<string, AbstractService[]> = new Map();
    private voiceStateHandlers: AbstractService[] = [];

    // TODO : Make that "register" methods allow to implement directly the action executed by the service

    /**
     * Registers a chat command with the specified name and associates it with the given service.
     * The command will be added to the chat command handlers collection.
     * 
     * @param commandName - The name of the chat command to register
     * @param service - The service instance that will handle this command
     */
    public registerChatCommand(commandName: string, service: AbstractService): void {
        log(`Registering chat command: ${commandName} with service: ${service.constructor.name}`, LOG_LEVEL.DEBUG);
        this.registerHandler(this.chatCommandHandlers, commandName, service);
    }

    /**
     * Registers a button interaction with the specified custom ID and associates it with the given service.
     * The button will be added to the button handlers collection.
     * 
     * @param customId - The custom ID of the button to register
     * @param service - The service instance that will handle this button interaction
     */
    public registerButton(customId: string, service: AbstractService): void {
        log(`Registering button interaction: ${customId} with service: ${service.constructor.name}`, LOG_LEVEL.DEBUG);
        this.registerHandler(this.buttonHandlers, customId, service);
    }

    /**
 * Registers a button prefix handler that will match any button whose customId
 * starts with the given prefix.
 * 
 * @param prefix - The prefix of button customIds to match
 * @param service - The service instance that will handle these button interactions
 */
    public registerButtonPrefix(prefix: string, service: AbstractService): void {
        log(`Registering button prefix handler: ${prefix} with service: ${service.constructor.name}`, LOG_LEVEL.DEBUG);
        this.registerHandler(this.buttonPrefixHandlers, prefix, service);
    }

    /**
     * Registers a modal interaction with the specified custom ID and associates it with the given service.
     * The modal will be added to the modal handlers collection.
     * 
     * @param customId - The custom ID of the modal to register
     * @param service - The service instance that will handle this modal interaction
     */
    public registerModal(customId: string, service: AbstractService): void {
        log(`Registering modal interaction: ${customId} with service: ${service.constructor.name}`, LOG_LEVEL.DEBUG);
        this.registerHandler(this.modalHandlers, customId, service);
    }

    /**
     * Registers a user context menu command with the specified name and associates it with the given service.
     * The command will be added to the user context menu handlers collection.
     * 
     * @param commandName - The name of the user context menu command to register
     * @param service - The service instance that will handle this command
     */
    public registerUserContextMenu(commandName: string, service: AbstractService): void {
        log(`Registering user context menu command: ${commandName} with service: ${service.constructor.name}`, LOG_LEVEL.DEBUG);
        this.registerHandler(this.userContextMenuHandlers, commandName, service);
    }

    /**
     * Registers a message context menu command with the specified name and associates it with the given service.
     * The command will be added to the message context menu handlers collection.
     * 
     * @param commandName - The name of the message context menu command to register
     * @param service - The service instance that will handle this command
     */
    public registerMessageContextMenu(commandName: string, service: AbstractService): void {
        log(`Registering message context menu command: ${commandName} with service: ${service.constructor.name}`, LOG_LEVEL.DEBUG);
        this.registerHandler(this.messageContextMenuHandlers, commandName, service);
    }

    /**
     * Registers a voice state handler with the given service.
     * The handler will be added to the voice state handlers collection.
     * 
     * @param service - The service instance that will handle voice state updates
     */
    public registerVoiceStateHandler(service: AbstractService): void {
        log(`Registering voice state handler: ${service.constructor.name}`, LOG_LEVEL.DEBUG);
        this.voiceStateHandlers.push(service);
    }

    private registerHandler(
        registry: Map<string, AbstractService[]>,
        key: string,
        service: AbstractService
    ): void {
        if (!registry.has(key)) {
            registry.set(key, []);
        }
        registry.get(key)?.push(service);
    }

    public handleChatInputCommand(interaction: ChatInputCommandInteraction): void {
        const handlers = this.chatCommandHandlers.get(interaction.commandName) || [];
        log(`Routing command '${interaction.commandName}' to ${handlers.length} handler(s)`, LOG_LEVEL.DEBUG);

        handlers.forEach(service => {
            try {
                log(`Interaction send to service '${service.constructor.name}' for command '${interaction.commandName}'`, LOG_LEVEL.DEBUG);
                service.handleChatInputCommand(interaction);
            } catch (error) {
                log(`Error in service handling command '${interaction.commandName}': ${error}`, LOG_LEVEL.ERROR);
            }
        });
    }

    public handleButtonInteraction(interaction: ButtonInteraction): void {
        // First try exact match
        const exactHandlers = this.buttonHandlers.get(interaction.customId) || [];

        // Then find prefix matches
        const prefixHandlers: AbstractService[] = [];
        this.buttonPrefixHandlers.forEach((handlers, prefix) => {
            if (interaction.customId.startsWith(prefix)) {
                prefixHandlers.push(...handlers);
            }
        });

        const allHandlers = [...exactHandlers, ...prefixHandlers];
        log(`Routing button '${interaction.customId}' to ${allHandlers.length} handler(s)`, LOG_LEVEL.DEBUG);

        allHandlers.forEach(service => {
            try {
                log(`Interaction send to service '${service.constructor.name}' for button '${interaction.customId}'`, LOG_LEVEL.DEBUG);
                service.handleButtonInteraction(interaction);
            } catch (error) {
                log(`Error in service handling button '${interaction.customId}': ${error}`, LOG_LEVEL.ERROR);
            }
        });
    }

    public handleModalButtonInteraction(interaction: ModalSubmitInteraction): void {
        const handlers = this.modalHandlers.get(interaction.customId) || [];
        log(`Routing modal '${interaction.customId}' to ${handlers.length} handler(s)`, LOG_LEVEL.DEBUG);

        handlers.forEach(service => {
            try {
                log(`Interaction send to service '${service.constructor.name}' for modal '${interaction.customId}'`, LOG_LEVEL.DEBUG);
                service.handleButtonModal(interaction);
            } catch (error) {
                log(`Error in service handling modal '${interaction.customId}': ${error}`, LOG_LEVEL.ERROR);
            }
        });
    }

    public handleUserContextMenu(interaction: UserContextMenuCommandInteraction): void {
        const handlers = this.userContextMenuHandlers.get(interaction.commandName) || [];
        log(`Routing user context menu '${interaction.commandName}' to ${handlers.length} handler(s)`, LOG_LEVEL.DEBUG);

        handlers.forEach(service => {
            try {
                log(`Interaction send to service '${service.constructor.name}' for user context menu '${interaction.commandName}'`, LOG_LEVEL.DEBUG);
                service.handleUserContextMenu(interaction);
            } catch (error) {
                log(`Error in service handling user context menu '${interaction.commandName}': ${error}`, LOG_LEVEL.ERROR);
            }
        });
    }

    public handleMessageContextMenu(interaction: MessageContextMenuCommandInteraction): void {
        const handlers = this.messageContextMenuHandlers.get(interaction.commandName) || [];
        log(`Routing message context menu '${interaction.commandName}' to ${handlers.length} handler(s)`, LOG_LEVEL.DEBUG);

        handlers.forEach(service => {
            try {
                log(`Interaction send to service '${service.constructor.name}' for message context menu '${interaction.commandName}'`, LOG_LEVEL.DEBUG);
                service.handleMessageContextMenu(interaction);
            } catch (error) {
                log(`Error in service handling message context menu '${interaction.commandName}': ${error}`, LOG_LEVEL.ERROR);
            }
        });
    }

    public handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
        this.voiceStateHandlers.forEach(service => {
            try {
                service.handleChannelConnection(oldState, newState);
            } catch (error) {
                log(`Error in service handling voice 'state update: $'{error}`, LOG_LEVEL.ERROR);
            }
        });
    }
}