// menuService.js
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el equivalente a __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const menuFilePath = join(__dirname, 'menuData.json');

export const MenuService = {
    // Obtener todos los productos
    async getAllProducts() {
        try {
            const data = await fs.readFile(menuFilePath, 'utf8');
            const menu = JSON.parse(data);
            return menu.productos;
        } catch (error) {
            console.error('Error al leer el menú:', error);
            return [];
        }
    },

    // Obtener un producto por ID
    async getProductById(id) {
        try {
            const data = await fs.readFile(menuFilePath, 'utf8');
            const menu = JSON.parse(data);
            return menu.productos.find(producto => producto.id === parseInt(id));
        } catch (error) {
            console.error('Error al buscar el producto:', error);
            return null;
        }
    },

    // Agregar un nuevo producto
    async addProduct(name, price) {
        try {
            const data = await fs.readFile(menuFilePath, 'utf8');
            const menu = JSON.parse(data);
            
            // Encontrar el siguiente ID disponible
            const maxId = Math.max(...menu.productos.map(p => p.id), 0);
            const newProduct = {
                id: maxId + 1,
                name,
                price: parseFloat(price)
            };
            
            menu.productos.push(newProduct);
            await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 2));
            return newProduct;
        } catch (error) {
            console.error('Error al agregar el producto:', error);
            throw error;
        }
    },

    // Actualizar un producto
    async updateProduct(id, updates) {
        try {
            const data = await fs.readFile(menuFilePath, 'utf8');
            const menu = JSON.parse(data);
            
            const index = menu.productos.findIndex(p => p.id === parseInt(id));
            if (index === -1) return null;
            
            menu.productos[index] = {
                ...menu.productos[index],
                ...updates
            };
            
            await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 2));
            return menu.productos[index];
        } catch (error) {
            console.error('Error al actualizar el producto:', error);
            throw error;
        }
    },

    // Eliminar un producto
    async deleteProduct(id) {
        try {
            const data = await fs.readFile(menuFilePath, 'utf8');
            const menu = JSON.parse(data);
            
            const index = menu.productos.findIndex(p => p.id === parseInt(id));
            if (index === -1) return false;
            
            menu.productos.splice(index, 1);
            await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 2));
            return true;
        } catch (error) {
            console.error('Error al eliminar el producto:', error);
            throw error;
        }
    }
};