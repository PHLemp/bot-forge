import { DBFaction } from "../../database/dbModel";
import { LOG_LEVEL, log } from "../../utils/LogUtils";

export type Group = {
    ownerUsrId: string;
    friendList: string[];
}

export class Faction {
    private factionName: string;
    private factionWelcomeMsg: string | null = null;
    private factionImageUrl: string | null = null;
    private discordUsrIdList: string[] = [];
    private maxMembers: number; // 0 = no limit
    private discordRole: string;
    private discordCategoryChannelId: string | undefined;
    private discordTextChannelId: string | undefined;
    private discordVoiceChannelId: string | undefined;

    constructor(
        factionName: string,
        factionWelcomeMsg: string | null,
        factionImageUrl: string | null,
        discordUsrIdList: string[],
        maxMembers: number,
        discordRoleName: string,
    ) {
        this.factionName = factionName;
        this.factionWelcomeMsg = factionWelcomeMsg;
        this.factionImageUrl = factionImageUrl;
        this.discordUsrIdList = discordUsrIdList;
        this.maxMembers = maxMembers;
        this.discordRole = discordRoleName;
    }

    static fromJson(json: Faction): Faction {
        const faction = new Faction(
            json.factionName,
            json.factionWelcomeMsg,
            json.factionImageUrl,
            json.discordUsrIdList,
            json.maxMembers,
            json.discordRole
        );

        faction.setDiscordCategoryChannelId(json.discordCategoryChannelId);
        faction.setDiscordTextChannelId(json.discordTextChannelId);
        faction.setDiscordVoiceChannelId(json.discordVoiceChannelId);

        return faction;
    }

    static toJson(faction: Faction): DBFaction {
        return {
            factionName: faction.getFactionName(),
            factionWelcomeMsg: faction.getFactionWelcomeMsg(),
            factionImageUrl: faction.getFactionImageUrl(),
            discordUsrIdList: faction.getDiscordUsrIdList(),
            maxMembers: faction.getMaxMembers(),
            discordRole: faction.getDiscordRole(),
            discordCategoryChannelId: faction.getDiscordCategoryChannelId(),
            discordTextChannelId: faction.getDiscordTextChannelId(),
            discordVoiceChannelId: faction.getDiscordVoiceChannelId()
        };
    }

    isFull(): boolean {
        return this.maxMembers !== 0 &&
            this.discordUsrIdList.length >= this.maxMembers;
    }

    getFactionName(): string {
        return this.factionName;
    }

    getFactionWelcomeMsg(): string | null {
        return this.factionWelcomeMsg;
    }

    getFactionImageUrl(): string | null {
        return this.factionImageUrl;
    }

    getDiscordUsrIdList(): string[] {
        return this.discordUsrIdList;
    }

    getMaxMembers(): number {
        return this.maxMembers;
    }

    getRemainingSlots(): number {
        if (this.maxMembers === 0) {
            log("Faction has no limit of members", LOG_LEVEL.INFO);
            return Number.MAX_VALUE;
        }
        return this.maxMembers - this.discordUsrIdList.length;
    }

    getDiscordRole(): string {
        return this.discordRole;
    }

    getDiscordCategoryChannelId(): string | undefined {
        return this.discordCategoryChannelId;
    }

    getDiscordTextChannelId(): string | undefined {
        return this.discordTextChannelId;
    }

    getDiscordVoiceChannelId(): string | undefined {
        return this.discordVoiceChannelId;
    }

    setDiscordCategoryChannelId(discordCategoryChannelId: string | undefined): void {
        this.discordCategoryChannelId = discordCategoryChannelId;
    }

    setDiscordTextChannelId(discordTextChannelId: string | undefined): void {
        this.discordTextChannelId = discordTextChannelId;
    }

    setDiscordVoiceChannelId(discordVoiceChannelId: string | undefined): void {
        this.discordVoiceChannelId = discordVoiceChannelId;
    }

    addMember(userId: string): boolean {
        return this.addMembers([userId]);
    }

    addMembers(userId: string[]): boolean {
        if (this.maxMembers === 0 || this.discordUsrIdList.length + userId.length <= this.maxMembers) {
            this.discordUsrIdList.push(...userId);
            return true;
        }
        return false;
    }

    removeMember(userId: string): boolean {
        const index = this.discordUsrIdList.indexOf(userId);
        if (index !== -1) {
            this.discordUsrIdList.splice(index, 1);
            return true;
        }
        return false;
    }

    isMember(userId: string): boolean {
        return this.discordUsrIdList.includes(userId);
    }
}