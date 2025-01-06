import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";

export const endFlow = addKeyword<Provider, Database>(utils.setEvent('END_FLOW'))
    .addAnswer('¡Gracias por tu pedido!')
    // Limpieza del estado global
    .addAction(async (_, { globalState }) => {
        console.log('Limpiando estado global...');
        globalState.clear();
    });
