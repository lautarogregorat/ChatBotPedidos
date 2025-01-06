import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { endFlow } from "./end.flow";

// Definimos el menú como un objeto para facilitar el acceso a los nombres
const MENU_ITEMS = {
    '1': { name: 'Empanada de Carne', price: 150 },
    '2': { name: 'Empanada de Jamón y Queso', price: 160 },
    '3': { name: 'Empanada de Humita', price: 140 },
    '4': { name: 'Empanada de Verdura', price: 140 },
    '5': { name: 'Empanada de Pollo', price: 150 },
    '6': { name: 'Gaseosa 500ml', price: 250 },
    '7': { name: 'Café', price: 200 },
    '8': { name: 'Cerveza Artesanal 500ml', price: 400 }
};

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
    const selection = ctx.body;
    if (MENU_ITEMS[selection]) {
        // Solo actualizamos la selección actual
        await state.update({ currentSelection: selection });
    }
}).addAction(async (_, { flowDynamic, state }) => {
    const currentSelection = state.get('currentSelection');
    const itemName = MENU_ITEMS[currentSelection]?.name;
    await flowDynamic(`Tu selección es: ${itemName}`);
}).addAnswer('Ingresa la cantidad (un numero)', {capture: true}, async (ctx, { state }) => {
    const quantity = parseInt(ctx.body);
    if (!isNaN(quantity)) {
        const currentSelection = state.get('currentSelection');
        const newOrder = {
            item: MENU_ITEMS[currentSelection].name,
            quantity: quantity,
            price: MENU_ITEMS[currentSelection].price
        };
        
        // Obtenemos el array actual de orders y si no existe lo inicializamos
        let currentOrders = state.get('orders');
        if (!currentOrders) {
            currentOrders = [];
        }
        
        // Agregamos el nuevo pedido
        currentOrders.push(newOrder);
        
        // Actualizamos el estado con el array modificado
        await state.update({ 
            orders: currentOrders,
            currentQuantity: quantity 
        });
    }
}).addAction(async (_, { flowDynamic, state }) => {
    const quantity = state.get('currentQuantity');
    await flowDynamic(`La cantidad es: ${quantity}`);
}).addAnswer(['Deseas seguir pidiendo? Ingresa "Si" o "No"'], {capture: true}, async (ctx, { gotoFlow, state, flowDynamic }) => {
    if (ctx.body.toLocaleLowerCase().includes('si')) {
        return gotoFlow(menuFlow);
    } else {
        const orders = state.get('orders') || [];
        
        // Creamos un resumen del pedido
        let orderSummary = '*Resumen de tu pedido:*\n\n';
        let total = 0;
        
        orders.forEach((order, index) => {
            orderSummary += `${index + 1}. ${order.item} x ${order.quantity} = $${order.price * order.quantity}\n`;
            total += order.price * order.quantity;
        });
        
        orderSummary += `\n*Total a pagar: $${total}*`;
        
        await flowDynamic(orderSummary);
        return gotoFlow(endFlow);
    }
});