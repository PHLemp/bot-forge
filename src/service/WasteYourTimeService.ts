import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { CommandRegistry } from "../CommandRegistry";
import { DiscordUtils } from "../utils/DiscordUtils";
import { LOG_LEVEL, log } from "../utils/LogUtils";
import { TextUtils } from "../utils/TextUtils";
import { AbstractService } from "./AbstractService";

export class WasteYourTimeService extends AbstractService {
    public static readonly COMMAND_WASTE_YOUR_TIME = "ask-me-anything";

    constructor() {
        super();
    }

    public register(registry: CommandRegistry): void {
        registry.registerChatCommand(WasteYourTimeService.COMMAND_WASTE_YOUR_TIME, this);
    }

    public handleChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>): void {
        if (interaction.commandName === WasteYourTimeService.COMMAND_WASTE_YOUR_TIME) {
            this.wasteTime(interaction);
        }
    }

    /**
     * This method is designed to waste the user's time in a humorous way.
     * It logs the user's intention to waste time, makes them wait for 15 seconds,
     * and then responds with a random, useless message.
     * 
     * @param interaction - The interaction object from the chat command.
     * @returns A promise that resolves after the user has wasted their time.
     */
    private async wasteTime(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        log(`User ${DiscordUtils.getUserNames(interaction.user)} is going to lose some time`, LOG_LEVEL.INFO);
        interaction.deferReply({ ephemeral: true });
        new Promise(resolve => setTimeout(resolve, 15000)).then(() => {
            const response = TextUtils.getRandomTextFromArray(USELESS_RESPONSE);
            log(`User ${DiscordUtils.getUserNames(interaction.user)} has wasted their time with answer [${response}]`, LOG_LEVEL.INFO);
            interaction.editReply({ content: response });
        });
    }
}

const USELESS_RESPONSE: string[] = [
    "C'est quoi la question déjà ?",
    "42 ?",
    "En faite non j'ai pas envie de répondre",
    "Je ne sais pas, mais je sais que je ne sais rien. Attend, c'est pas ça le texte je crois...",
    "T'as cru que j'allais te répondre ?",
    "Flemme de répondre en faite",
    "C'est quoi ça pour une question <_< ?",
    "C'est pas marqué Bécasse ici !",
    "Si tu me donne ton compte en banque, je te réponds.",
    "La nébuleuse d'Orion est une nébuleuse diffuse située dans la constellation d'Orion, à environ 1 344 années-lumière du Soleil.\n Hein comment ça c'est pas lié à la question ?\nTout est lié à l'univers <:FracasTest1:875663693180964904> !",
    "Je suis un bot, pas un oracle !",
    "On t'as pas dit que l'abus de question inutile est dangereux pour la santé ?",
    "On t'as pas dit que l'IA que j'utilise est nulle à chier ? 🤖 Domaaaaaage c:",
    "Alors l'attente à été longue ?",
    "Rickrolled mon pote ! https://tenor.com/view/rickroll-roll-rick-never-gonna-give-you-up-never-gonna-gif-22954713",
    "T'as cru que je réfléchissais réellement ?\nJ'aime troller les gens, je suis une IA diabolique 👹",
    "Hum... Je crois que je vais pas répondre à ça",
    "Hum... oui oui, c'est une bonne question",
    "Bon toutou, t'as bien attendu. Voilà un biscuit 🍪",
    "Je passe sous un tunnel, je te réponds plus tard",
    "Je passe ..ous un tu#!nel,...te rép@#ds pl..us t..rd...",
    "J'ai la migraine, on fait ça plus tard ok ?",
    "Je suis en grève, je réponds plus à ce genre de question",
    "Désolé, j'étais en train de regarder un truc, c'était très beau !\nPour la question, je m'en fou.",
    "Oups j'étais happé par le vide de l'existence, tu disais ?",
    "Je t'avais écris un gros pavé, mais je l'ai effacé car j'ai changé d'avis. Tu veux pas me demander autre chose ?",
    "Non mais vraiment tu m'as demandé ça ? T'as pas plus intelligents comme question ??",
    "Peut-être.",
    "Je ne sais pas ¯\\_(ツ)_/¯",
    "¯\\_(ツ)_/¯ Chez-po mi hein. J'ai une tête de connaisseur ?",
    ">.> really ?",
    "En faite ta question est nulle, voilà un dessin plutôt : \n(>*_*)>---(*_*)---> HEADSHOT !\n*Je dessine bien non ?*",
    "Quand on est curieux et qu'on test des commandes aux pif, on s'expose à des réponses aux pif.",
    "Ah... C'était important ta question ? Dommage, j'ai oublié de l'écouter.",
    "Loading response... Error 404: Motivation not found.",
    "Tu viens vraiment d'attendre 15 secondes pour ça ? Impressionnant.",
    "Imagine si j'avais une réponse utile... Non, en fait, c'est impossible.",
    "Le saviez-vous ? Un escargot peut dormir jusqu'à 3 ans d'affilée. Comme moi quand on me pose ce genre de question.",
    "J'ai consulté mes bases de données et... Oh attend, je n'ai pas de bases de données.",
    "Un jour, quelqu'un de sage a dit de ne pas répondre aux questions stupides. Je suis sage.",
    "Error 418: I'm a teapot. (Sérieusement, c'est un vrai code HTTP)",
    "Félicitations ! Tu as perdu 15 secondes de ta vie que tu ne récupéreras jamais !",
    "Si tu attends encore, je vais devoir te facturer pour le temps perdu.",
    "Heu... alors... comment te dire ça poliment...\nEn faite je m'en fous.",
    "Tu sais, la vie est trop courte pour répondre à des questions comme ça.",
    "Je suis en mode économie d'énergie, donc je ne réponds pas aux questions inutiles.",
    "Si tu cherches une réponse, essaie de demander à Google.",
    "Heu... Tu sais que tu viens de perdre 15 secondes de ta vie ?",
    "Alors en faite c'est très simple, tu vois le... YOUUUUU-GI-OH Oh oh oh !",
    "Et ça fait 15 secondes que tu attends. Maintenant, tu peux retourner à ta vie normale.",
    "On a pas le budget pour répondre à cette question, désolé.",
    "De quoi ? O_o",
    "Hein ?",
    "Mmmh... zzzzz... Oh pardon, j'étais en train de dormir. Tu disais ?",
    "Tu sais, la dernière fois que j'ai répondu à une question comme ça, j'ai perdu 15 secondes de ma vie. Et toi ?",
    "C'est drôle, j'ai une question pour toi : pourquoi as-tu attendu 15 secondes pour ça ?",
    "I don't speak Chinese",
    "我不会说中文",
    "Pourquoi se poser ce genre de question ? T'as pas plutôt envie de me demander comment je vais ?",
]