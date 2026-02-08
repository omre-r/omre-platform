const pg = require("pg")
const { Pool } = pg

const { v4: uuidv4 } = require("uuid");
const { S3Client, DeleteObjectTaggingCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const dotenv = require("dotenv");
dotenv.config();


const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;

const BUCKET_NAME = process.env.BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;

// working with images 
const s3Client = new S3Client({ 
  region: 'us-east-1',
  credentials: {
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    accessKeyId: S3_ACCESS_KEY_ID
  }
});

let pool = null;
let reconnectInterval = null;

connectToDB()
reconnectInterval = setInterval(connectToDB, 2000);

async function connectToDB(){
    if (pool) return
    try{
        const newPool = new Pool({
            user: DB_USERNAME,
            password: DB_PASSWORD,
            host: DB_HOST,
            port: DB_PORT,
            database: DB_NAME,
            connectionTimeoutMillis: 2000,
            //change if doing remote
            // ssl: {
            //     rejectUnauthorized: false
            // }
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
        //log err only when debugging
        console.log("Failed to connect to AWS RDS database.");
    }
}

async function createTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
            id VARCHAR(100) PRIMARY KEY,
            email VARCHAR(500),
            firstname VARCHAR(100),
            lastname VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
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
            description TEXT,
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

    //modifications made to make it match Ayman's lambda function 'omre-cognito-post-confirmation'
    async createUser(options){
        const {id, email, firstname, lastname, preferrednotes} = options;

        const adminEmails = [
            '@omrefragrances.com',
            'zchriste16@gmail.com',
            'contact@aymannazir.com',
            'muradsaleh2022@gmail.com'
        ];

        //IMPORTANT: roles will mainly be decided via access tokens later, so the "role" field may be removed
        // Check if admin (later, there may be a mapping of roles rather than a simple isAdmin check)
        const isAdmin = adminEmails.some(admin => 
            admin.startsWith('@') ? email.endsWith(admin) : email === admin
        );   

        let result;
        const query = `INSERT INTO users (id, email, firstname, lastname, role, preferrednotes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        try{
            result = await pool.query(query, [id, email, firstname, lastname, isAdmin ? "admin" : "user", JSON.stringify(preferrednotes)]);
        }catch(err){
            console.error(err)
            return {success: false, message: "Failed to create user", status: 400}
        }
        return {success: true, data: {user: result.rows?.[0]}}
    }

    async deleteUser(id){
        const query = `DELETE FROM users WHERE id = $1`
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to delete user", status: 400}
        }
        return {success: true}
    }
    
    //rate limiting (ex: max 200) not needed yet
    async getUsers(){
        const query = `SELECT * FROM users`
        let users;

        try{
            const res = await pool.query(query);
            users = res.rows
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to get users", status: 400}
        }
        return {success: true, data: {users}}
    }

    async getUser(id){
        const query = `SELECT * FROM users WHERE id = $1`
        
        let user;
        try{
            const res = await pool.query(query, [id]);
            user = res.rows?.[0]
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to get user", status: 400}
        }
        return {success: true, data: {user}}
    }
}

/*
Methods are designed based on flows. A user will modify different fields
in different situations (changePassword / updateLogin), but a product is 
likely updated in a single setting. Therefore, a single updateProduct is provided.
*/
class Products{
    static modifiableFields = ["type", "name", "variation", "price", "images", "quantity", "notes", "description", "ishidden", "isfeatured"];

    async createProduct(options){
        const {type, name, variation, price, images, quantity, notes, description, isfeatured, ishidden} = options;
        const id = uuidv4();

        // Validation
        if (!name || name.trim() === '') {
            return {success: false, status: 400, message: 'Product name is required'};
        }
        if (!price || price <= 0) {
            return {success: false, status: 400, message: 'Valid price is required'};
        }
        if (images.length === 0) {
            return {success: false, status: 400, message: '1 image is required'};
        }
        if (images.length > 5) {
            return {success: false, status: 400, message: 'Maximum of 10 images allowed'};
        }
        // Ensure all URLs are from CloudFront
        const invalidUrls = images.filter(url => !url.startsWith(CLOUDFRONT_DOMAIN));
        if (invalidUrls.length > 0) {
            return  {success: false, status: 400, message: 'All image URLs must be valid CloudFront URLs' };
        }  
    
        let result;
        const query = `INSERT INTO products (id, type, name, variation, price, images, quantity, notes, description, isfeatured, ishidden) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;`;
        try{
            result = await pool.query(query, [id, type, name, variation, price, JSON.stringify(images), quantity, JSON.stringify(notes), description, isfeatured, ishidden]);
        }catch(err){

            console.error(err)
            return {success: false, status: 500, message: 'Failed to create product' };
        }

        //remove tags
        const tagRemovalResults = await Promise.all(
            images.map(async (url) => {
                try {
                    const s3Key = url.replace(`${CLOUDFRONT_DOMAIN}/`, '');
                    await s3Client.send(new DeleteObjectTaggingCommand({
                        Bucket: BUCKET_NAME,
                        Key: s3Key
                    }));
                    //console.log('Tag removed from:', s3Key);
                    return { url, success: true };
                } catch (error) {
                    console.error('Failed to remove tag from:', url, error);
                    // Don't fail the request - just log
                    return { url, success: false, error: error.message };
                }
            })
        );
        const failedTagRemovals = tagRemovalResults.filter(r => !r.success);
        if (failedTagRemovals.length > 0) {
            console.warn('Some tags failed to remove:', failedTagRemovals);
        }

        return {success: true, data: {product: result.rows?.[0]}}
    }
    
    async deleteProduct(id){
        const query = `DELETE FROM products WHERE id = $1 RETURNING *`
        try{
            const result = await pool.query(query, [id]);
            const images = result?.rows?.[0]?.images;
            for (let image of images){
                const key = image.split("/")?.[1];
                s3Client.send(new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: key
                }));
            } 
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to delete product", status: 400}
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
            return {success: false, message: "Failed to get products", status: 400}
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
            return {success: false, message: "Failed to get active products", status: 400}
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
            return {success: false, message: "Failed to get product", status: 400}
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
            return {success: false, message: "Failed to update product", status: 400}
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

    async createReview(options){
        const {customerid, productid, message, rating, images} = options;
        const id = uuidv4();

        let result;
        const query = `INSERT INTO reviews (id, customerid, productid, message, rating, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        try{
            result = await pool.query(query, [id, customerid, productid, message, rating, JSON.stringify(images)]);
        }catch(err){
            console.error(err)
            return {success: false, message: "Failed to create review", status: 400}
        }
        return {success: true, data: {review: result.rows?.[0]}}
    }

    async deleteReview(id){
        const query = `DELETE FROM reviews WHERE id = $1`
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to delete review", status: 400}
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
            return {success: false, message: "Failed to get product reviews", status: 400}
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
            return {success: false, message: "Failed to get user reviews", status: 400}
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
            return {success: false, message: "Failed to get reviews", status: 400}
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
            return {success: false, message: "Failed to update review", status: 400}
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
    async createOrder(options){
        const {customerid, items, total} = options;
        const id = uuidv4();

        let order;
        const query = `INSERT INTO orders (id, customerid, items, total) VALUES ($1, $2, $3, $4) RETURNING *;`;
        try{
            order = await pool.query(query, [id, customerid, JSON.stringify(items), total]);
        }catch(err){
            console.error(err)
            return {success: false, message: "Failed to create order", status: 400}
        }
        return {success: true, data: {order: order.rows?.[0]}}
    }

    async deleteOrder(id){
        const query = `DELETE FROM orders WHERE id = $1`
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to delete order", status: 400}
        }
        return {success: true}
    }

    async cancelOrder(id, cancelreason){
        const query = `UPDATE orders SET status = 'canceled', cancelreason = $1 WHERE id = $2`;
        try{
            await pool.query(query, [cancelreason, id]);
        }catch(err){
            console.error(err)
            return {success: false, message: "Failed to cancel order", status: 400}
        }
        return {success: true}
    }
    async completeOrder(id){
        const query = `UPDATE orders SET status = 'complete' WHERE id = $1`;
        try{
            await pool.query(query, [id]);
        }catch(err){
            console.error(err)
            return {success: false, message: "Failed to complete order", status: 400}
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
