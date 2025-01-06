import { addKeyword, addAnswer } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { menuFlow } from "./menu.flow";

const REGEX_BIENVENIDA = '/^(hola|buen(os|as)? (días?|tardes?|noches?|dia,?|dia)|qué tal|hey|hi|holi|saludos|me gustaría (hacer|realizar) un pedido|quiero (ordenar|hacer un pedido)|cómo andás?|todo bien|che|qué onda|qué hacés|buenas|buen día|buenas noches|buenas tardes|qué hay|me podrías ayudar|estoy buscando algo|quisiera pedir algo|una consulta|necesito algo|cómo estás|cómo va|cómo te va|disculpa|perdón|permiso|aló|holaaa|holis)/gi';


export const bienvenidaFlow = addKeyword<Provider, Database>(REGEX_BIENVENIDA, {regex: true})
.addAnswer([`🙌 Holaa! Si deseas realizar un pedido, escribe la palabra "Pedir"`],
    {capture: true },
    async (ctx, { gotoFlow }) => {
        if (ctx.body.toLocaleLowerCase().includes('pedir')) {
            return gotoFlow(menuFlow)
        }
        return
    }
)
