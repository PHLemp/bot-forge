import { APIInteractionGuildMember, CacheType, ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager } from "discord.js";
import { ADMIN_ROLE_LIST, STAFF_ROLE_LIST } from './model/constants';
import { WasteYourTimeService } from "./service/WasteYourTimeService";
import { log, LOG_LEVEL } from "./utils/LogUtils";

export class SecurityManager {
    private constructor() { }

    public static isInStaff(roleInput?: GuildMemberRoleManager | GuildMember | APIInteractionGuildMember | string[] | null): boolean {
        if (!roleInput) {
            log("User roles not found", LOG_LEVEL.WARN);
            return false;
        }

        if (roleInput instanceof Array) {
            return roleInput.some(role => STAFF_ROLE_LIST.includes(role));
        }

        if (roleInput instanceof GuildMemberRoleManager) {
            const rolesArray = roleInput.cache.map(role => role.id);
            return rolesArray.some(role => STAFF_ROLE_LIST.includes(role));
        }

        const roles = roleInput.roles;
        return Array.isArray(roles) ?
            roles.some(role => STAFF_ROLE_LIST.includes(role)) :
            roles.cache.map(role => role.id).some(roleId => STAFF_ROLE_LIST.includes(roleId));
    }

    public static isNotAdmin(member: GuildMember | APIInteractionGuildMember | null) {
        if (!member) {
            log("Member not found", LOG_LEVEL.WARN);
            return true; // If no member, they're not an admin
        }

        const roles = member.roles;
        if (Array.isArray(roles)) {
            return !roles.some(role => ADMIN_ROLE_LIST.includes(role));
        } else {
            return !roles.cache.map(role => role.id).some(roleId => ADMIN_ROLE_LIST.includes(roleId));
        }
    }

    public static isNotInStaff(userRoles?: GuildMemberRoleManager | GuildMember | APIInteractionGuildMember | string[] | null): boolean {
        return !this.isInStaff(userRoles);
    }

    public static isPublicCommand(interaction: ChatInputCommandInteraction<CacheType>) {
        const isPublic = PUBLIC_COMMANDS.includes(interaction.commandName);
        return isPublic;
    }
}

const PUBLIC_COMMANDS = [
    WasteYourTimeService.COMMAND_WASTE_YOUR_TIME
];