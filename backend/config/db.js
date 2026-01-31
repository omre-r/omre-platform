const pg = require("pg")
const { Pool } = pg

const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

dotenv.config({path: "../.env"});

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;

let pool = null;
let reconnectInterval = null;

connectToDB()
reconnectInterval = setInterval(connectToDB, 2000);

let usersInstance = null;
let productsInstance = null;
let reviewsInstance = null;
let ordersInstance = null;

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

        console.log("Successfully connected to DB!");
        pool = newPool
        clearInterval(reconnectInterval);
        createTables()
    }catch(err){
        console.log("Failed to connect to AWS RDS database.");
    }
}

async function createTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
            id VARCHAR(100),
            email VARCHAR(500),
            password VARCHAR(100),
            firstname VARCHAR(100),
            lastname VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
            lastlogin DATETIME,
            role VARCHAR(10) 
        )
    `);
    /* 
    instance of 'notes' entry:
    {
        top: ["Cognac"],
        heart: ["Cinnamon" "Oak"],
        base: ["Praline", "Vanilla"],
    }
    */
    await pool.query(`
        CREATE TABLE IF NOT EXISTS products(
            id VARCHAR(100),
            type VARCHAR(100),
            name VARCHAR(1000),
            variation VARCHAR(200),
            price DECIMAL(10, 2),
            images JSONB,
            quantity INT,
            notes JSONB
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews(
            id VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
            message VARCHAR(500),
            rating SMALLINT,
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders(
            id VARCHAR(100),
            customerid VARCHAR(100)
            created TIMESTAMPTZ DEFAULT NOW(),
            items JSONB
            total DECIMAL(10, 2),
        )
    `);
}

class Users{
    static getUsersInstance(){
        usersInstance = usersInstance ? usersInstance : new Users() ;
        return usersInstance;
    }

}

module.exports = {Users}
