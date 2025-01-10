import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { iniciarSesionFlow } from "./iniciarsesion.flow";
import { MenuService } from './menuService';

// Flow para agregar producto
export const agregarProductoFlow = addKeyword<Provider, Database>(utils.setEvent('AGREGAR_PRODUCTO'))
    .addAnswer('📝 *Agregar Nuevo Producto*\n\nIngresa el nombre del producto:', 
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const nombre = ctx.body.trim();
            if (nombre.length < 3) {
                return fallBack('❌ El nombre debe tener al menos 3 caracteres.');
            }
            await state.update({ tempProduct: { name: nombre } });
        })
    .addAnswer('Ingresa el precio del producto:', 
        { capture: true },
        async (ctx, { state, fallBack, gotoFlow, flowDynamic }) => {
            const precio = parseFloat(ctx.body.trim());
            if (isNaN(precio) || precio <= 0) {
                return fallBack('❌ Por favor, ingresa un precio válido mayor a 0.');
            }
            
            const tempProduct = state.get('tempProduct');
            
            try {
                await MenuService.addProduct(tempProduct.name, precio);
                await flowDynamic('✅ Producto agregado correctamente');
            } catch (error) {
                console.error('Error al agregar producto:', error);
                await flowDynamic('❌ Hubo un error al agregar el producto. Por favor, intenta nuevamente.');
            }
            
            await state.update({ tempProduct: null });
            return gotoFlow(editMenu);
        });

// Flow para modificar producto
export const modificarProductoFlow = addKeyword<Provider, Database>(utils.setEvent('MODIFICAR_PRODUCTO'))
    .addAnswer('✏️ *Modificar Producto*\n\nIngresa el número del producto a modificar:', 
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const productId = parseInt(ctx.body.trim());
            console.log('productId:', productId);
            try {
                const producto = await MenuService.getProductById(productId);
                if (!producto) {
                    return fallBack('❌ Producto no encontrado. Por favor, ingresa un ID válido.');
                }
                await state.update({ editingProduct: productId });
            } catch (error) {
                return fallBack('❌ Error al buscar el producto.');
            }
        }).addAction(async (_, { flowDynamic, fallBack }) => {
            try {
                const productos = await MenuService.getAllProducts();
                let menuText = '📋 *Productos Disponibles:*\n\n';
                productos.forEach(producto => {
                    menuText += `${producto.id}. ${producto.name} - $${producto.price}\n`;
                });
                await flowDynamic(menuText);
            } catch (error) {
               return fallBack('❌ Error al cargar la lista de productos.');
            }
        })
    .addAnswer('Ingresa el nuevo nombre (o "skip" para mantener el actual):', 
        { capture: true },
        async (ctx, { state }) => {
            const nombre = ctx.body.trim();
            if (nombre.toLowerCase() !== 'skip') {
                const editingProduct = state.get('editingProduct');
                await state.update({ tempUpdates: { name: nombre } });
            }
        })
    .addAnswer('Ingresa el nuevo precio (o "skip" para mantener el actual):', 
        { capture: true },
        async (ctx, { state, fallBack, gotoFlow, flowDynamic }) => {
            const input = ctx.body.trim();
            const updates = state.get('tempUpdates') || {};
            
            if (input.toLowerCase() !== 'skip') {
                const precio = parseFloat(input);
                if (isNaN(precio) || precio <= 0) {
                    return fallBack('❌ Por favor, ingresa un precio válido mayor a 0 o "skip".');
                }
                updates.price = precio;
            }
            
            const editingProduct = state.get('editingProduct');
            
            try {
                if (Object.keys(updates).length > 0) {
                    await MenuService.updateProduct(editingProduct, updates);
                    await flowDynamic('✅ Producto actualizado correctamente');
                } else {
                    await flowDynamic('ℹ️ No se realizaron cambios al producto');
                }
            } catch (error) {
                console.error('Error al actualizar producto:', error);
                await flowDynamic('❌ Error al actualizar el producto');
            }
            
            await state.update({ editingProduct: null, tempUpdates: null });
            return gotoFlow(editMenu);
        });

// Flow para eliminar producto
export const eliminarProductoFlow = addKeyword<Provider, Database>(utils.setEvent('ELIMINAR_PRODUCTO'))
    .addAction(async (_, { flowDynamic }) => {
        try {
            const productos = await MenuService.getAllProducts();
            let menuText = '📋 *Productos Disponibles:*\n\n';
            productos.forEach(producto => {
                menuText += `${producto.id}. ${producto.name} - $${producto.price}\n`;
            });
            await flowDynamic(menuText);
        } catch (error) {
            await flowDynamic('❌ Error al cargar la lista de productos.');
        }
    })
    .addAnswer('🗑️ *Eliminar Producto*\n\nIngresa el número del producto a eliminar:', 
        { capture: true },
        async (ctx, { fallBack, state }) => {
            const productId = parseInt(ctx.body.trim());
            
            try {
                const producto = await MenuService.getProductById(productId);
                if (!producto) {
                    return fallBack('❌ Producto no encontrado. Por favor, ingresa un ID válido.');
                }
                await state.update({ deletingProduct: productId });
            } catch (error) {
                return fallBack('❌ Error al buscar el producto.');
            }
        })
    .addAnswer('¿Estás seguro de eliminar este producto? (Si/No)', 
        { capture: true },
        async (ctx, { fallBack, gotoFlow, flowDynamic, state }) => {
            const respuesta = ctx.body.trim().toLowerCase();
            if (!['si', 'no'].includes(respuesta)) {
                return fallBack('❌ Por favor, responde solo con "Si" o "No"');
            }
            
            const productId = state.get('deletingProduct');
            
            if (respuesta === 'si') {
                try {
                    await MenuService.deleteProduct(productId);
                    await flowDynamic('✅ Producto eliminado correctamente');
                } catch (error) {
                    console.error('Error al eliminar producto:', error);
                    await flowDynamic('❌ Error al eliminar el producto');
                }
            } else {
                await flowDynamic('Operación cancelada');
            }
            
            await state.update({ deletingProduct: null });
            return gotoFlow(editMenu);
        });

// Flow para ver menú
export const verMenuFlow = addKeyword<Provider, Database>(utils.setEvent('VER_MENU'))
    .addAction(async (_, { flowDynamic, gotoFlow }) => {
        try {
            const productos = await MenuService.getAllProducts();
            let menuText = '📋 *Menú Actual*\n\n';
            productos.forEach(producto => {
                menuText += `${producto.id}. ${producto.name} - $${producto.price}\n`;
            });
            
            await flowDynamic(menuText);
        } catch (error) {
            console.error('Error al cargar menú:', error);
            await flowDynamic('❌ Error al cargar el menú');
        }
        return gotoFlow(editMenu);
    });

// Flow principal de edición de menú
export const editMenu = addKeyword<Provider, Database>(utils.setEvent('ABMC_MENU'))
    .addAction(async (_, { state }) => {
        state.clear();
    })
    .addAnswer('🛠️ *Editar Menú*')
    .addAnswer('Por favor, selecciona una opción:\n\n' +
        '1️⃣ *Agregar Producto*\n' +
        '2️⃣ *Modificar Producto*\n' +
        '3️⃣ *Eliminar Producto*\n' +
        '4️⃣ *Ver Menú*\n' +
        '5️⃣ *Salir*\n', 
        { capture: true }, 
        async (ctx, { fallBack, gotoFlow }) => {
            const input = ctx.body.trim();
            switch (input) {
                case '1':
                    return gotoFlow(agregarProductoFlow);
                case '2':
                    return gotoFlow(modificarProductoFlow);
                case '3':
                    return gotoFlow(eliminarProductoFlow);
                case '4':
                    return gotoFlow(verMenuFlow);
                case '5':
                    return gotoFlow(iniciarSesionFlow);
                default:
                    return fallBack('❌ Por favor, selecciona una opción válida (1-5)');
            }
        });