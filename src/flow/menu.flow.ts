import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { endFlow } from "./end.flow";

export const menuFlow = addKeyword<Provider, Database>(utils.setEvent('MENU_FLOW'))
.addAnswer([
  '🥟 *Menú de Empanadas y Bebidas* 🥟\n\n' +
  '*Empanadas (unidad):*\n' +
  '1. 🥩 Empanada de Carne - $150\n' +
  '2. 🧀 Empanada de Jamón y Queso - $160\n' +
  '3. 🥔 Empanada de Humita - $140\n' +
  '4. 🌱 Empanada de Verdura - $140\n' +
  '5. 🍗 Empanada de Pollo - $150\n\n' +
  '*Bebidas:*\n' +
  '6. 🥤 Gaseosa 500ml - $250\n' +
  '7. ☕ Café - $200\n' +
  '8. 🍺 Cerveza Artesanal 500ml - $400\n\n' +
  'Selecciona una opcion:'
], {capture: true}, async (ctx, { state }) => {
    await state.update({seleccion: ctx.body})
}).addAction(async (_, { flowDynamic, state }) => {
    await flowDynamic(`Tu selección es: ${state.get('seleccion')}`)
    return
}).addAnswer('Ingresa la cantidad (un numero)', {capture: true}, async (ctx, { state }) => {
    await state.update({cantidad: ctx.body})})
.addAction(async (_, { flowDynamic, state }) => {
    await flowDynamic(`La cantidad es: ${state.get('cantidad')}`)
    return
}).addAnswer(['Deseas seguir pidiendo? Ingresa "Si" o "No"'], {capture: true}, async (ctx, { gotoFlow }) => {
    if (ctx.body.toLocaleLowerCase().includes('si')) {
        return gotoFlow(menuFlow)
    } else {
        return gotoFlow(endFlow)
    }
})