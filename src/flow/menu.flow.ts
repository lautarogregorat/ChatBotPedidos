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

    let menuText = `*NUESTRO MENÚ*\n`;
    // explicar que el precio es por unidad
    menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    product.forEach(producto => {
        menuText += `*${producto.id}* - ${producto.name} - $${producto.price}\n`;
    });
    
    menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    await state.update({ currentMenu: mappedMenu });
    console.log('Menu:', menuText);
    await flowDynamic(menuText);
}).addAction(async (_, { gotoFlow }) => {
    return gotoFlow(menuFlow);
});

export const menuFlow = addKeyword<Provider, Database>(utils.setEvent('MENU_FLOW'))
.addAnswer([
    '📝 *¿Cómo pedir?*\n' +
    'Los productos se piden de uno en uno:\n\n' +
    '1️⃣ Escribe el *número del producto*\n' +
    '2️⃣ Seguido de la *cantidad* que deseas\n\n' +
    '*Ejemplo:*\n' +
    '• Para pedir 3 empanadas del producto 1: escribe *1 3*\n' +
    '• Después podrás agregar más productos a tu pedido\n\n' +
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
    const selectedProduct = MENU_ITEMS[selection];

    if (!selectedProduct) {     
        return fallBack('❌ Producto no válido. Por favor, selecciona un número valido del menú');
    }

    if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
        return fallBack('❌ Cantidad inválida. Por favor, ingresa un número entre 1 y 100');
    }

    const currentOrders = state.get('orders') || [];
    
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
    await flowDynamic(`✅ *Agregado a tu pedido*: ${lastOrder.item} x ${lastOrder.quantity}`);
})
.addAnswer([
    '📝 *¿Deseas agregar algo más a tu pedido?*\n\n' +
    '• *Si* para seguir pidiendo\n' +
    '• *No* para ver el resumen de tu pedido\n' +
    '• *Cancelar* para anular el pedido'
], {capture: true}, async (ctx, { gotoFlow, state, flowDynamic, fallBack }) => {
    const response = ctx.body.trim().toLowerCase();
    
    if (!['si', 'no', 'cancelar'].includes(response)) {
        return fallBack('❌ Por favor, responde solo con "Si" o "No"');
    }

    if (response === 'si') {
        // Ir al flow de pedidos adicionales
        return gotoFlow(additionalMenuFlow);
    } else if (response === 'cancelar') {
        return gotoFlow(cancelFlow);
    } else {
        return handleOrderSummary(null, { state, flowDynamic, gotoFlow, fallBack });
    }
});

// Flow para pedidos adicionales
export const additionalMenuFlow = addKeyword<Provider, Database>(utils.setEvent('ADDITIONAL_MENU_FLOW'))
.addAnswer([
    '🛒 *¿Qué más deseas agregar a tu pedido?*\n\n' +
    'Escribe el *número* del producto y la *cantidad*\n' +
    '*Ejemplo:* 2 5'
], {capture: true}, async (ctx, { state, fallBack }) => {
    const input = ctx.body.trim();
    const inputParts = input.split(' ');
    
    if (inputParts.length !== 2) {
        return fallBack('❌ Formato inválido. Por favor, ingresa el número del producto seguido de la cantidad (ejemplo: "1 3")');
    }

    const [selection, quantityStr] = inputParts;
    const quantity = parseInt(quantityStr);
    const MENU_ITEMS = state.get('currentMenu');
    const selectedProduct = MENU_ITEMS[selection];

    if (!selectedProduct) {     
        return fallBack('❌ Producto no válido. Por favor, selecciona un número valido del menú');
    }

    if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
        return fallBack('❌ Cantidad inválida. Por favor, ingresa un número entre 1 y 100');
    }

    const currentOrders = state.get('orders') || [];
    
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
    await flowDynamic(`✅ *Agregado a tu pedido*: ${lastOrder.item} x ${lastOrder.quantity}`);
})
.addAnswer([
    '📝 *¿Deseas agregar algo más a tu pedido?*\n\n' +
    '• *Si* para seguir pidiendo\n' +
    '• *No* para ver el resumen de tu pedido\n' +
    '• *Cancelar* para anular el pedido'
], {capture: true}, async (ctx, { gotoFlow, state, flowDynamic, fallBack }) => {
    const response = ctx.body.trim().toLowerCase();
    
    if (!['si', 'no', 'cancelar'].includes(response)) {
        return fallBack('❌ Por favor, responde solo con "Si" o "No"');
    }

    if (response === 'si') {
        // Permanecer en el mismo flow para pedidos adicionales
        return gotoFlow(additionalMenuFlow);
    } else if (response === 'cancelar') {
        return gotoFlow(cancelFlow);
    } else {
        return handleOrderSummary(null, { state, flowDynamic, gotoFlow, fallBack });
    }
});

// Función auxiliar para manejar el resumen del pedido
const handleOrderSummary = async (_, { state, flowDynamic, gotoFlow, fallBack }) => {
    const orders = state.get('orders') || [];
    
    if (orders.length === 0) {
        return fallBack('❌ No has realizado ningún pedido. Por favor, selecciona al menos un producto.');
    }
    
    let orderSummary = '🧾 *Resumen de tu pedido*\n\n';
    let total = 0;
    
    orders.forEach(order => {
        orderSummary += `${order.item} x ${order.quantity} = $${order.price * order.quantity}\n`;
        total += order.price * order.quantity;
    });
    
    orderSummary += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    orderSummary += `*Total a pagar: $${total}*`;
    
    await flowDynamic(orderSummary);
    return gotoFlow(endFlow);
};

// Flow para cancelar el pedido
export const cancelFlow = addKeyword<Provider, Database>(utils.setEvent('CANCEL_FLOW'))
.addAction(async (_, { state, flowDynamic }) => {
    state.clear();
    await flowDynamic('❌ *Pedido cancelado*\nPuedes volver a empezar cuando quieras.');
})
.addAction(async (_, { gotoFlow }) => {
    return gotoFlow(verMenuInicioFlow);
});