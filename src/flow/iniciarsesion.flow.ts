import { addKeyword, addAnswer, utils } from "@builderbot/bot";
import { join } from "path";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { editMenu } from "./editmenu.flow";

export const iniciarSesionFlow = addKeyword<Provider, Database>('registro')
.addAnswer('🔐 *Iniciar Sesión* 🔐\n\n')
.addAnswer('Por favor, ingresa tu usuario:', {capture: true}, async (ctx, { state }) => {
    await state.update({usuario: ctx.body})
})
.addAnswer('Por favor ingresa la contraseña', {capture: true}, async(ctx, {state}) => {
    await state.update({contrasena: ctx.body})
})
.addAction( async (_, {gotoFlow, state, flowDynamic}) => {
    if(state.get('usuario') !== 'admin' || state.get('contrasena') !== '123') {
        return gotoFlow(iniciarSesionFlow)
    } else{
        await flowDynamic('Inicio de sesión exitoso')
        return gotoFlow(editMenu)
    }

})
