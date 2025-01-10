import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { endFlow } from "./end.flow";

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
    '🌟 *Menú Principal* 🌟\n\n' +
    '¡Selecciona lo que deseas pedir respondiendo con el número y cantidad!\n' +
    'Por ejemplo: Si deseas 3 Empanadas de Carne, responde con *1 3*.\n\n' +
    '🍽️ *Empanadas (unidad):*\n' +
    '1️⃣ 🥩 *Empanada de Carne* - $150\n' +
    '2️⃣ 🧀 *Empanada de Jamón y Queso* - $160\n' +
    '3️⃣ 🥔 *Empanada de Humita* - $140\n' +
    '4️⃣ 🌱 *Empanada de Verdura* - $140\n' +
    '5️⃣ 🍗 *Empanada de Pollo* - $150\n\n' +
    '🥤 *Bebidas:*\n' +
    '6️⃣ 🥤 *Gaseosa 500ml* - $250\n' +
    '7️⃣ ☕ *Café* - $200\n' +
    '8️⃣ 🍺 *Cerveza Artesanal 500ml* - $400\n\n' +
    '💡 *Instrucciones:*\n' +
    '- Responde con el número del producto seguido de la cantidad\n' +
    '- Ejemplo: "1 12" para pedir 12 empanadas de carne\n'
], {capture: true}, async (ctx, { state, flowDynamic, fallBack }) => {
    // Validación del formato de entrada
    const input = ctx.body.trim();
    const inputParts = input.split(' ');
    
    if (inputParts.length !== 2) {
        return fallBack('❌ Formato inválido. Por favor, ingresa el número del producto seguido de la cantidad (ejemplo: "1 3")');
    }

    const [selection, quantityStr] = inputParts;
    const quantity = parseInt(quantityStr);

    // Validación del número de producto
    if (!MENU_ITEMS[selection]) {
        return fallBack('❌ Producto no válido. Por favor, selecciona un número del 1 al 8');
    }

    // Validación de la cantidad
    if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
        return fallBack('❌ Cantidad inválida. Por favor, ingresa un número entre 1 y 50');
    }

    // Obtenemos el array actual de orders y si no existe lo inicializamos
    let currentOrders = state.get('orders');
    if (!currentOrders) {
        currentOrders = [];
    }
    
    const newOrder = {
        item: MENU_ITEMS[selection].name,
        quantity: quantity,
        price: MENU_ITEMS[selection].price
    };
    
    // Agregamos el nuevo pedido
    currentOrders.push(newOrder);
    
    // Actualizamos el estado
    await state.update({ orders: currentOrders });
    
}).addAction(async (_, { flowDynamic, state }) => {
    const orders = state.get('orders') || [];
    const lastOrder = orders[orders.length - 1];
    await flowDynamic(`✅ Agregado al pedido: ${lastOrder.item} x ${lastOrder.quantity}`);
})
.addAnswer(['¿Deseas seguir pidiendo? Ingresa "Si" o "No"'], {capture: true}, async (ctx, { gotoFlow, state, flowDynamic, fallBack }) => {
    const response = ctx.body.trim().toLowerCase();
    
    // Validación de la respuesta Si/No
    if (!['si', 'no'].includes(response)) {
        return fallBack('❌ Por favor, responde solo con "Si" o "No"');
    }

    if (response === 'si') {
        return gotoFlow(menuFlow);
    } else {
        const orders = state.get('orders') || [];
        
        // Validación de que haya al menos un pedido
        if (orders.length === 0) {
            return fallBack('❌ No has realizado ningún pedido. Por favor, selecciona al menos un producto.');
        }
        
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