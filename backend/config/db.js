const pg = require("pg")
const { Pool } = pg

const dotenv = require("dotenv");
dotenv.config({path: "../.env"});

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;

let pool = null;
let reconnectInterval = null;
async function connectToDB(){
    if (pool) return
    try{
        const newPool = new Pool({
            user: DB_USERNAME,
            password: DB_PASSWORD,
            host: DB_HOST,
            port: DB_PORT,
            database: DB_NAME,
            connectionTimeoutMillis: 2000
        });
        await newPool.query("SELECT NOW()");
        if (pool){
            newPool.end();
            return;
        }
        pool = newPool
        clearInterval(reconnectInterval);
        console.log("Successfully connected to DB!");
    }catch(err){
        console.log("Failed to connect to AWS RDS database.");
    }
}
connectToDB()
reconnectInterval = setInterval(connectToDB, 2000);


//will soon export classes
module.exports = {nothing: "nothing"}
