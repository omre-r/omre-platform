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
            notes JSONB,
            isfeatured BOOLEAN,
            ishidden BOOLEAN
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

    async createUser(options){
        const {email, password, firstname, lastname, role} = options;
        const id = uuidv4();

        const query = `INSERT INTO users (id, email, password, firstname, lastname, role) VALUES (?, ?, ?, ?, ?, ?);`;
        try{
            await pool.query(query, [id, email, password, firstname, lastname, role]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true}
    }
    
    //rate limiting (ex: max 200) not needed yet
    async getAllUsers(){
        const query = `SELECT (id, email, firstname, lastname, role, created) FROM users`
        let users;

        try{
            const res = await pool.query(query);
            users = res.rows
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {users}}
    }

    async getUser(id){
        const query = `SELECT (id, email, firstname, lastname, role, created) FROM users WHERE id = ?`
        let user;

        try{
            const res = await pool.query(query, [id]);
            user = res.rows[0]
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {user}}
    }

    async updateLogin(id){
        const query = `UPDATE users SET lastlogin = NOW() WHERE id = ?`

        try{
            await pool.query(query, [id])
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true}
    }

    async changePassword(options){
        const {id, password} = options
        const query = `UPDATE users SET password = ? WHERE id = ?`
        try{
            //will hash soon
            await pool.query(query, [password, id])
        }catch(err){
            console.error(err);
            return null
        }
        return {success: true}
    }   
}

class Products{
    static getProductsInstance(){
        productsInstance = productsInstance ? productsInstance : new Products() ;
        return productsInstance;
    }

    async createProduct(options){
        const {type, name, variation, price, images, quantity, notes, isfeatured, ishidden} = options;
        const id = uuidv4();

        const query = `INSERT INTO products (id, type, name, variation, price, images, quantity, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
        try{
            await pool.query(query, [id, type, name, variation, price, images, quantity, notes, isfeatured, ishidden]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true}
    }
    
}
module.exports = {Users, Products}
