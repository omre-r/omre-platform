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
            id VARCHAR(100) PRIMARY KEY,
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
            id VARCHAR(100) PRIMARY KEY,
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
    /*
    instance of 'responses' entry (client/admin only. Can change this preference):
    [
        {isAdmin: true, "message": "Thank you..."},
        {isAdmin: false, "I appreciate..."},
        {isAdmin: false, "btw I think..."}
    ]
    */
    await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews(
            id VARCHAR(100) PRIMARY KEY,
            customerid VARCHAR(100),
            productid VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
            message VARCHAR(500),
            rating SMALLINT,
            images JSONB,
            responses JSONB
        )
    `);

    /*
    Status may change, but for now it can be:
        -ordered
        -complete
        -canceled
    */
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders(
            id VARCHAR(100) PRIMARY KEY,
            orderid VARCHAR(100),
            customerid VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
            items JSONB,
            total DECIMAL(10, 2),
            status VARCHAR(100) DEFAULT "ordered",
            cancelreason VARCHAR(500)
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

        const query = `INSERT INTO users (id, email, password, firstname, lastname, role) VALUES ($1, $2, $3, $4, $5, $6);`;
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
        const query = `SELECT (id, email, firstname, lastname, role, created) FROM users WHERE id = $1`
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
        const query = `UPDATE users SET lastlogin = NOW() WHERE id = $1`

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
        const query = `UPDATE users SET password = $1 WHERE id = $2`
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

/*
Methods are designed based on flows. A user will modify different fields
in different situations (changePassword / updateLogin), but a product is 
likely updated in a single setting. Therefore, a single updateProduct is provided.
*/
class Products{
    static modifiableFields = ["type", "name", "variation", "price", "images", "quantity", "notes"];
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
    
    async deleteProduct(id){
        const query = `DELETE FROM products WHERE id = $1`
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true}
    }

    async getProducts(){
        const query = `SELECT * FROM products;`
        let products;

        try{
            const res = await pool.query(query);
            products = res.rows;
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {products}}
    }

    async getActiveProducts(){
        const query = `SELECT * FROM products WHERE ishidden IS FALSE;`
        let products;

        try{
            const res = await pool.query(query);
            products = res.rows;
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {products}}
    }

    async getProduct(id){
        const query = `SELECT * FROM products WHERE id = $1;`;
        let product;

        try{
            const res = await pool.query(query, [id]);
            product = res.rows[0]
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {product}}
    }

    /*
    Expects object of fields in need of updating
    Ex) options === {type: "10ml spray", price: 35.85}
    */
    async updateProduct(id, options) {
        const fields = Object.keys(options);
        const query = this.formatUpdateQuery(fields);
        if (!query) return null;

        try{
            await pool.query(formattedQuery, [...fields.map(f => options[f]), id])
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true}
    }

    formatUpdateQuery(fields){
        if (fields.length === 0) return null;

        let formattedQuery = `UPDATE products SET `;
        let i;
        for (i = 0; i < fields.length; i++){
            if (!modifiableFields.includes(fields[i])) return null;

            formattedQuery += `${fields[i]} = $${i + 1}`
            if (i !== fields.length - 1) formattedQuery += ', ';
        }
        formattedQuery += ` WHERE id = $${i + 1};`
        return formattedQuery
    }
}

class Reviews{
    static modifiableFields = ["responses"] //we may allow edits at some point, but just this for now
    static getReviewsInstance(){
        reviewsInstance = reviewsInstance ? reviewsInstance : new Reviews() ;
        return reviewsInstance;
    }

    async createReview(options){
        const {customerid, productid, message, rating, images, responses} = options;
        const id = uuidv4();

        const query = `INSERT INTO reviews (id, customerid, productid, message, rating, images, responses) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
        try{
            await pool.query(query, [id, customerid, productid, message, rating, images, responses]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true}
    }
    
    async getProductReviews(productid){
        const query = `SELECT * FROM reviews WHERE productid = $1 ORDER BY created DESC`;
        let reviews;

        try{
            const res = await pool.query(query, [productid]);
            reviews = res.rows;
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {reviews}}
    }

    async getUserReviews(customerid){
        const query = `SELECT * FROM reviews WHERE customerid = $1 ORDER BY created DESC`;
        let reviews;

        try{
            const res = await pool.query(query, [customerid]);
            reviews = res.rows;
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {reviews}}
    }

    async getReviews(){
        const query = `SELECT * FROM reviews ORDER BY created DESC`;
        let reviews;

        try{
            const res = await pool.query(query);
            reviews = res.rows;
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {reviews}}
    }

    async updateReview(id, options){
        const fields = Object.keys(options);
        const query = this.formatUpdateQuery(fields);
        if (!query) return null;

        try{
            await pool.query(formattedQuery, [...fields.map(f => options[f]), id])
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true}
    }
    formatUpdateQuery(fields){
        if (fields.length === 0) return null;

        let formattedQuery = `UPDATE reviews SET `;
        let i;
        for (i = 0; i < fields.length; i++){
            if (!modifiableFields.includes(fields[i])) return null;

            formattedQuery += `${fields[i]} = $${i + 1}`
            if (i !== fields.length - 1) formattedQuery += ', ';
        }
        formattedQuery += ` WHERE id = $${i + 1};`
        return formattedQuery
    }
}

class Orders{
            // id VARCHAR(100) PRIMARY KEY,
            // orderid VARCHAR(100),
            // customerid VARCHAR(100),
            // created TIMESTAMPTZ DEFAULT NOW(),
            // items JSONB,
            // total DECIMAL(10, 2),
            // status VARCHAR(100) DEFAULT "ordered"
    static getOrdersInstance(){
        ordersInstance = ordersInstance ? ordersInstance : new Orders() ;
        return ordersInstance
    }

    async createOrder(options){
        const {orderid, customerid, items, total} = options;
        const id = uuidv4();

        const query = `INSERT INTO orders (id, orderid, customerid, items, total) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
        try{
            await pool.query(query, [id, orderid, customerid, items, total]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true}
    }
    async cancelOrder(id){
        const query = `UPDATE orders SET status = "canceled" WHERE id = $1`;
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true}
    }
    async completeOrder(id){
        const query = `UPDATE orders SET status = "complete" WHERE id = $1`;
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true}
    }

    async getOrder(id){
        const query = `SELECT * FROM orders WHERE id = $1`
        let order;

        try{
            const res = await pool.query(query, [id]);
            order = res.rows[0]
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {order}}
    }
}
    
module.exports = {Users, Products, Reviews, Orders}
