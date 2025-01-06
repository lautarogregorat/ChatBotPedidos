import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";


export const endFlow = addKeyword<Provider, Database>(utils.setEvent('END_FLOW'))
.addAnswer(['En resumen, tu pedido es:'], {capture: true}, async (ctx, { state, flowDynamic }) => {
    const allData = state.getMyState()
    await flowDynamic(`Tu pedido es: ${allData.seleccion} - ${allData.cantidad}`)
})
.addAnswer('Gracias por tu pedido!')