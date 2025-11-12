import { UUID } from "crypto";
import { Faction } from "../model/event/Faction";

export type DbModel = {
    events: DBEvent[];
    availablePlaces: number;
}

export type DBEvent = {
    id: UUID;
    factions: Faction[];
    eventName: string;
    eventDescription: string | undefined;
    isActive: boolean;
    canJoin: boolean;
    channelIdToDisplayInscriptionMsg: string;
    inscriptionMsgId: string;
    joinRandomly: boolean;
}

export type DBFaction = {
    factionName: string;
    factionWelcomeMsg: string | null;
    factionImageUrl: string | null;
    discordUsrIdList: string[];
    maxMembers: number;
    discordRole: string;
    discordCategoryChannelId: string | undefined;
    discordTextChannelId: string | undefined;
    discordVoiceChannelId: string | undefined;
}