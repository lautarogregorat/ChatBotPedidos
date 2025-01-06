import { MongoAdapter as Database } from '@builderbot/database-mongo'
import dotenv from 'dotenv'
const result = dotenv.config()


export const adapterDB = new Database({
dbUri: process.env.MONGO_DB_URI,
dbName: process.env.MONGO_DB_NAME,
})
