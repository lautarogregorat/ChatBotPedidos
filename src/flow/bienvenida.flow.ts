import { addKeyword, addAnswer } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { menuFlow } from "./menu.flow";

const REGEX_BIENVENIDA = '/^(hola|buen(os|as)? (días?|tardes?|noches?)|qué tal|hey|hi|holi|saludos|me gustaría (hacer|realizar) un pedido|quiero (ordenar|hacer un pedido))/gi';

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
