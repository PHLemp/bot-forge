//// CATEGORY
export const CATEGORY_EVENT_AND_GAME_ID = "766016632853233694";

//// CHANNELS
export const BOT_VOICE_CHANNEL_ID = "1437096039307018380";
export const ADMIN_BOT_CHANNEL_ID = "1210644170637582347";
export const ADMIN_CHANNEL_ID = "1015698949375541308"; // 1015698949375541308
export const MODERATOR_CHANNEL_ID = "1043215260104003737";
export const TABLE_RONDE_CHANNEL_ID = "714884541717807205";
export const EVENEMENT_ET_JEUX_CHANNEL_ID = "766016632853233694";
export const HABITUE_CHANNEL_ID = "1308051698438373458";
export const TUTO_COMMANDS_CHANNEL_ID = "1308506709769195614";
export const ORGA_CHANNEL_ID = '940285074409148416'; // 940285074409148416
export const PROGRAMATION_CHANNEL_ID = '1383375886635634728'; // 1383375886635634728
export const PROGRAMMING_EVENT_PROPOSALS_CHANNEL_ID = '1285711122468569190';


//// USER ID
export const REDFIELD_ID = "253604335462645761";
export const ESPERANZA_ID = "843367859156811787";

//// ROLE ID
export const ADMIN_ROLE_ID = "1017155608295768175";
export const HABITUE_ROLE_ID = "1294314694689030156";
export const FORGERON_ROLE_ID = "1065687583469883452";
export const MODERATOR_ROLE_ID = "748926543191081110";
export const BOT_ADMIN_ROLE_ID = "1263179645654667345";
export const MITHRANDIR_ROLE_ID = "1131895910872383549";
export const ORGA_DU_COMBAT_ROLE_ID = "939186852173340702";
export const SUPPORT_ROLE_ID = "1150091058026397748";
export const HORLOGE_ROLE_ID = "1374804907973935188";

export const ADMIN_ROLE_LIST = [
    ADMIN_ROLE_ID,
    BOT_ADMIN_ROLE_ID,
    HORLOGE_ROLE_ID
];

// Used to check if user can use bot command 
export const STAFF_ROLE_LIST = [
    ...ADMIN_ROLE_LIST,
    MODERATOR_ROLE_ID,
    ORGA_DU_COMBAT_ROLE_ID,
    MITHRANDIR_ROLE_ID
];

export const EMOTE_FRACAS_EPEE = "<:FracasCombattant:756196050381045910>";
export const EMOTE_FRACAS_COUCOU = "<:FracaHey:756230260294680628>";
export const EMOTE_FRACAS_DOIGT_LEVÉ = "<:FracasTest1:875663693180964904>";
export const EMOTE_FRACAS_PLEURE = "<:FracasPleure:756244798045814852>";

//////////////// INTERACTIONS
//// EVENT
export const EVENT_REQUEST_EVENT_CREATION_FROM_MODAL = "eventRequestCreation";
export const EVENT_ADD_FACTION_FROM_MODAL = "eventAddFaction";
export const EVENT_REMOVE_FACTION_FROM_MODAL = "eventRemoveFactionModal";
export const EVENT_CREATE_GROUP_BUTTON_ID = "createGroupButton";
export const EVENT_FINISH_CREATION_BUTTON = "houseFinishCreation";
export const EVENT_JOIN_FACTION_ALONE_BUTTON = "joinFactionAloneButton";
export const EVENT_CANCEL_EVENT_CREATION_BUTTON = "houseDeleteEventButton";
export const EVENT_JOIN_FACTION_WITH_FRIENDS_BUTTON = "joinFactionWithFriendsButton";
export const EVENT_CREATE_NEW_FACTION_BUTTON = "houseCreateNewHouseButton";
export const EVENT_REMOVE_NEW_FACTION_BUTTON = "houseRemoveNewHouseButton";
export const EVENT_JOIN_FACTION_BUTTON_START_STRING = "JOIN_FACTION_BUTTON_";

//// DISCORD COMMANDS
export const COMMAND_CREATE_HOUSES_EVENT = "create-event";
export const COMMAND_DELETE_HOUSES_EVENT = "delete-event";
export const COMMAND_REQUEST_EVENT_CREATION = 'request-event-creation';
export const COMMAND_LIST_VALIDATED_EVENTS = 'list-validated-events';
export const COMMAND_GREENLIGHT_EVENTS = 'greenlight-events';

//// OPTION NAMES
export const PING_REGISTERED_MESSAGE_TO_SEND_OPTION = "message-to-send";
export const PING_REGISTERED_EVENT_ID_OPTION = "event-id";
export const DELETE_EVENT_NAME_OPTION = "event-name";
export const CREATE_HOUSES_TARGET_CHANNEL_OPTION = "target-channel";
export const WASTE_YOUR_TIME_INPUT = "your-question-here";
export const OPTION_TEAM_BALANCER_TEAM_NUMBER = "team-number";
export const OPTION_MENU_GET_USER_WARNING = "user-warning-option";

export const REQUEST_EVENT_TITLE_OPTION = 'titre';
export const REQUEST_EVENT_START_DATE_OPTION = 'date_de_debut';
export const REQUEST_EVENT_GAME_TYPE_OPTION = 'jeu_et_mods';
export const REQUEST_EVENT_VOICE_CHANNEL_OPTION = 'channel_vocal';
export const REQUEST_EVENT_BANNER_OPTION = 'url_banniere';

//// CONTEXT MENU
export const CONTEXT_MENU_ADD_USER_WARNING = "Créer un signalement";
export const CONTEXT_MENU_GET_USER_WARNING = "Voir signalements d'un user";

//// SCHEDULER TIMINGS
export const ORGA_EVENT_CREATION_REMINDER_DAY = 5; // Vendredi
export const ORGA_EVENT_CREATION_REMINDER_HOUR = 15;
export const ORGA_EVENT_CREATION_REMINDER_MINUTE = 45;
export const ADMIN_REMINDER_DAY = 6; // Samedi
export const ADMIN_REMINDER_HOUR = 12;
export const ADMIN_REMINDER_MINUTE = 0;