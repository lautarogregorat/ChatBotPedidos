import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { endFlow } from "./end.flow";
import { MenuService } from "./menuService";

export const verMenuInicioFlow = addKeyword<Provider, Database>(utils.setEvent('VER_MENU_INICIO'))
.addAction(async (_, { flowDynamic, state }) => {
    state.clear();
    const product = await MenuService.getAllProducts();

    const mappedMenu = product.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {});

    let menuText = `✨ *NUESTRO MENÚ * ✨\n`;
    // explicar que el precio es por unidad
    menuText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    
    product.forEach(producto => {
        menuText += `*${producto.id}* - ${producto.name} - $${producto.price}\n`;
    });
    
    menuText += `━━━━━━━━━━━━━━━━━━━━━\n`;

    await state.update({ currentMenu: mappedMenu });
    console.log('Menu:', menuText);
    await flowDynamic(menuText);
}).addAction(async (_, { gotoFlow }) => {
    return gotoFlow(menuFlow);
});

export const menuFlow = addKeyword<Provider, Database>(utils.setEvent('MENU_FLOW'))
.addAnswer([
    '📝 *¿Cómo pedir?*\n' +
    'Escribe el *número del producto* seguido de la *cantidad*\n' +
    '*Ejemplo:*\n' +
    '• Para pedir 3 empanadas del producto 1: escribe *1 3*\n' +
    '¡Estamos listos para tomar tu pedido! 😊'
], {capture: true}, async (ctx, { state, fallBack }) => {
    const input = ctx.body.trim();
    const inputParts = input.split(' ');
    
    if (inputParts.length !== 2) {
        return fallBack('❌ Formato inválido. Por favor, ingresa el número del producto seguido de la cantidad (ejemplo: "1 3")');
    }

    const [selection, quantityStr] = inputParts;
    const quantity = parseInt(quantityStr);
    const MENU_ITEMS = state.get('currentMenu');
    console.log('MENU_ITEMS:', MENU_ITEMS);
    const selectedProduct = MENU_ITEMS[selection];

    if (!selectedProduct) {     
        return fallBack('❌ Producto no válido. Por favor, selecciona un número valido del menú');
    }

    if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
        return fallBack('❌ Cantidad inválida. Por favor, ingresa un número entre 1 y 100');
    }

    let currentOrders = state.get('orders');
    if (!currentOrders) {
        currentOrders = [];
    }
    
    const newOrder = {
        item: MENU_ITEMS[selection].name,
        quantity: quantity,
        price: MENU_ITEMS[selection].price
    };
    
    currentOrders.push(newOrder);
    await state.update({ orders: currentOrders });
    
}).addAction(async (_, { flowDynamic, state }) => {
    const orders = state.get('orders') || [];
    const lastOrder = orders[orders.length - 1];
    await flowDynamic(`✅ *¡Excelente elección!*\nAgregado a tu pedido: ${lastOrder.item} x ${lastOrder.quantity}`);
})
.addAnswer([
    '📝 *¿Deseas agregar algo más a tu pedido?*\n' +
    'Responde:\n' +
    '• *Si* para seguir pidiendo\n' +
    '• *No* para ver el resumen de tu pedido'
], {capture: true}, async (ctx, { gotoFlow, state, flowDynamic, fallBack }) => {
    const response = ctx.body.trim().toLowerCase();
    
    if (!['si', 'no'].includes(response)) {
        return fallBack('❌ Por favor, responde solo con "Si" o "No"');
    }

    if (response === 'si') {
        return gotoFlow(menuFlow);
    } else {
        const orders = state.get('orders') || [];
        
        if (orders.length === 0) {
            return fallBack('❌ No has realizado ningún pedido. Por favor, selecciona al menos un producto.');
        }
        
        let orderSummary = '🧾 *Resumen de tu pedido* 🧾\n\n';
        let total = 0;
        
        orders.forEach((order, index) => {
            orderSummary += `${index + 1}. ${order.item}\n`;
            orderSummary += `   • Cantidad: ${order.quantity}\n`;
            orderSummary += `   • Subtotal: $${order.price * order.quantity}\n\n`;
            total += order.price * order.quantity;
        });
        
        orderSummary += `━━━━━━━━━━━━━━━━━━━━━\n`;
        orderSummary += `*Total a pagar: $${total}*`;
        
        await flowDynamic(orderSummary);
        return gotoFlow(endFlow);
    }
});