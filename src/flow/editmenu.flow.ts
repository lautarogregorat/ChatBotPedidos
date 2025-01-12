import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { iniciarSesionFlow } from "./iniciarsesion.flow";
import { MenuService } from './menuService';

// Variable global para el texto del menú
let menuText = '';

// Función para actualizar el texto del menú
const updateMenuText = (productos: any[]) => {
    menuText = '📋 *Productos Disponibles:*\n\n';
    productos.forEach(producto => {
        menuText += `${producto.id}. ${producto.name} - $${producto.price}\n`;
    });
    return menuText;
};

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


export const verProductosModificablesFlow = addKeyword<Provider, Database>(utils.setEvent('VER_PRODUCTOS_MODIFICABLES'))
    .addAction(async (_, { flowDynamic }) => {
        const productos = await MenuService.getAllProducts();
        const menuText = updateMenuText(productos);
        await flowDynamic([`✏️ *Modificar Producto*\n\n${menuText}`]);
    }).addAction(async (_, { gotoFlow }) => {
        return gotoFlow(modificarProductoFlow);
    })

export const verProductosElimibalesFlow = addKeyword<Provider, Database>(utils.setEvent('VER_PRODUCTOS_ELIMINABLES'))
    .addAction(async (_, { flowDynamic }) => {
        const productos = await MenuService.getAllProducts();
        const menuText = updateMenuText(productos);
        await flowDynamic([`🗑️ *Eliminar Producto*\n\n${menuText}`]);
    }).addAction(async (_, { gotoFlow }) => {
        return gotoFlow(eliminarProductoFlow);
    })


// Flow para modificar producto
export const modificarProductoFlow = addKeyword<Provider, Database>(utils.setEvent('MODIFICAR_PRODUCTO'))
    .addAnswer('Ingresa el número del producto a modificar:',
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const productId = parseInt(ctx.body.trim());
            const currentMenu = state.get('currentMenu');

            // Validar el producto seleccionado
            const producto = currentMenu.find(p => p.id === productId);
            if (!producto) {
                return fallBack('❌ Producto no encontrado. Por favor, ingresa un ID válido.');
            }
            await state.update({ editingProduct: productId });
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
    .addAnswer('Ingresa el número del producto a eliminar:',
        { capture: true },
        async (ctx, { state, fallBack }) => {
            const productId = parseInt(ctx.body.trim());
            const currentMenu = state.get('currentMenu');
            // Validar el producto seleccionado
            const producto = currentMenu.find(p => p.id === productId);
            if (!producto) {
                return fallBack('❌ Producto no encontrado. Por favor, ingresa un ID válido.');
            }
            await state.update({ deletingProduct: productId });
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
    .addAction(async (_, { flowDynamic, gotoFlow, state }) => {
        const currentMenu = state.get('currentMenu');
        let menuText = '📋 *Menú Actual*\n\n';
        currentMenu.forEach(producto => {
            menuText += `${producto.id}. ${producto.name} - $${producto.price}\n`;
        });

        await flowDynamic(menuText);
        return gotoFlow(editMenu);
    });

// Flow principal de edición de menú
export const editMenu = addKeyword<Provider, Database>(utils.setEvent('ABMC_MENU'))
    .addAction(async (_, { state, flowDynamic }) => {
        state.clear();
        try {
            // Cargar el menú actual y guardarlo en el estado
            const productos = await MenuService.getAllProducts();
            await state.update({ currentMenu: productos });
            updateMenuText(productos);
        } catch (error) {
            console.error('Error al cargar menú:', error);
            await flowDynamic('❌ Error al cargar el menú');
        }
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
                    return gotoFlow(verProductosModificablesFlow);
                case '3':
                    return gotoFlow(verProductosElimibalesFlow);
                case '4':
                    return gotoFlow(verMenuFlow);
                case '5':
                    return gotoFlow(iniciarSesionFlow);
                default:
                    return fallBack('❌ Por favor, selecciona una opción válida (1-5)');
            }
        });