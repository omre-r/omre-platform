const pg = require("pg")
const { Pool } = pg

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt")

const dotenv = require("dotenv");
dotenv.config();

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
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000
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
        console.error("CONNECTION ERROR:", err); // <--- Print the actual error!
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
            lastlogin TIMESTAMPTZ,
            role VARCHAR(10),
            preferrednotes JSONB
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
        {isadmin: true, "message": "Thank you..."},
        {isadmin: false, "message":  "I appreciate..."},
        {isadmin: false, "message":  "btw I think..."}
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
            responses JSONB DEFAULT '[]'::JSONB
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
            customerid VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
            items JSONB,
            total DECIMAL(10, 2),
            status VARCHAR(100) DEFAULT 'ordered',
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
        const {email, password, firstname, lastname, role, preferrednotes} = options;
        const id = uuidv4();
        const hashedPass = await bcrypt.hash(password, 10);

        let result;
        const query = `INSERT INTO users (id, email, password, firstname, lastname, role, preferrednotes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, firstname, lastname, role, preferrednotes, created, lastlogin;`;
        try{
            result = await pool.query(query, [id, email, hashedPass, firstname, lastname, role, JSON.stringify(preferrednotes)]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true, data: {user: result.rows?.[0]}}
    }

    async deleteUser(id){
        const query = `DELETE FROM users WHERE id = $1`
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true}
    }
    
    //rate limiting (ex: max 200) not needed yet
    async getUsers(){
        const query = `SELECT id, email, firstname, lastname, role, preferrednotes, created, lastlogin FROM users`
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

        const query = `SELECT id, email, firstname, lastname, role, preferrednotes, created, lastlogin FROM users WHERE id = $1`
        let user;

        try{
            const res = await pool.query(query, [id]);
            user = res.rows?.[0]
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true, data: {user}}
    }

    async validateLogin(email, password){        
        let user;
        const checkPassQuery = `SELECT * FROM users WHERE email = $1`;
        const updateLoginQuery = `UPDATE users SET lastlogin = NOW() WHERE id = $1`;
        try{
            user = (await pool.query(checkPassQuery, [email]))?.rows?.[0];
            if (!user) return null;

            const matches = await bcrypt.compare(password, user.password)
            if (!matches) return {success: true};

            await pool.query(updateLoginQuery, [user.id]);
        }catch(err){
            console.error(err);
            return null;
        }
        delete user.password
        return {success: true, data: {user}};
    }

    async changePassword(id, password){
        const query = `UPDATE users SET password = $1 WHERE id = $2`;
        try{
            const hashedPass = await bcrypt.hash(password, 10);
            await pool.query(query, [hashedPass, id]);
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
    static modifiableFields = ["type", "name", "variation", "price", "images", "quantity", "notes", "ishidden", "isfeatured"];
    static getProductsInstance(){
        productsInstance = productsInstance ? productsInstance : new Products() ;
        return productsInstance;
    }

    async createProduct(options){
        const {type, name, variation, price, images, quantity, notes, isfeatured, ishidden} = options;
        const id = uuidv4();

        let result;
        const query = `INSERT INTO products (id, type, name, variation, price, images, quantity, notes, isfeatured, ishidden) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;`;
        try{
            result = await pool.query(query, [id, type, name, variation, price, JSON.stringify(images), quantity, JSON.stringify(notes), isfeatured, ishidden]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true, data: {product: result.rows?.[0]}}
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
        // const query = `SELECT * FROM products;`
        const query = `
        SELECT
            p.*,
            (
            SELECT pi.image_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.is_main DESC, pi.display_order ASC
            LIMIT 1
            ) AS main_image_url
        FROM products p;
        `;
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
        // Grabs product based on the actual ID
        const productQuery = `SELECT * FROM products WHERE id = $1;`;
        // Taking that id and getting the matching image (Could have used join probably but rusty)
        const imagesQuery = `
            SELECT id, product_id, image_url, is_main, display_order
            FROM product_images
            WHERE product_id = $1
            ORDER BY display_order ASC;
        `;

        let product;
        let images;

        try{
            // Execute the sql for the specific id given
            const res = await pool.query(productQuery, [id]);
            product = res.rows[0]
            const imagesRes = await pool.query(imagesQuery, [id]);
            images = imagesRes.rows || [];

            // Attatch the imagesQuery images to the actual products images!
            product.images = images;
            
            // This line in ProductsPanel.jsx : Images: {Array.isArray(selectedProduct.images) ? selectedProduct.images.length : 0}
            // Will properly display the selectedProducts length of images
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
            await pool.query(query, [...fields.map(f => typeof options[f] === "object" ? JSON.stringify(options[f]) : options[f]), id])
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
            if (!Products.modifiableFields.includes(fields[i])) return null;

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
        const {customerid, productid, message, rating, images} = options;
        const id = uuidv4();

        let result;
        const query = `INSERT INTO reviews (id, customerid, productid, message, rating, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        try{
            result = await pool.query(query, [id, customerid, productid, message, rating, JSON.stringify(images)]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true, data: {review: result.rows?.[0]}}
    }

    async deleteReview(id){
        const query = `DELETE FROM reviews WHERE id = $1`
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err);
            return null;
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
            await pool.query(query, [...fields.map(f => typeof options[f] === "object" ? JSON.stringify(options[f]) : options[f]), id])
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
            if (!Reviews.modifiableFields.includes(fields[i])) return null;

            formattedQuery += `${fields[i]} = $${i + 1}`
            if (i !== fields.length - 1) formattedQuery += ', ';
        }
        formattedQuery += ` WHERE id = $${i + 1};`
        return formattedQuery
    }
}

class Orders{
    static getOrdersInstance(){
        ordersInstance = ordersInstance ? ordersInstance : new Orders() ;
        return ordersInstance
    }

    async createOrder(options){
        const {customerid, items, total} = options;
        const id = uuidv4();

        let order;
        const query = `INSERT INTO orders (id, customerid, items, total) VALUES ($1, $2, $3, $4) RETURNING *;`;
        try{
            order = await pool.query(query, [id, customerid, JSON.stringify(items), total]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true, data: {order: order.rows?.[0]}}
    }

    async deleteOrder(id){
        const query = `DELETE FROM orders WHERE id = $1`
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err);
            return null;
        }
        return {success: true}
    }

    async cancelOrder(id, cancelreason){
        const query = `UPDATE orders SET status = 'canceled', cancelreason = $1 WHERE id = $2`;
        try{
            await pool.query(query, [cancelreason, id]);
        }catch(err){
            console.error(err)
            return null
        }
        return {success: true}
    }
    async completeOrder(id){
        const query = `UPDATE orders SET status = 'complete' WHERE id = $1`;
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
