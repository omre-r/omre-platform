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

// Makes repeated attempts to connect to a database
async function connectToDB(){
    if (pool) return
    try{
        const useSSL = DB_HOST && DB_HOST !== "localhost" && DB_HOST !== "127.0.0.1";
        const newPool = new Pool({
            user: DB_USERNAME,
            password: DB_PASSWORD,
            host: DB_HOST,
            port: DB_PORT,
            database: DB_NAME,
            connectionTimeoutMillis: 2000,
            ssl: useSSL ? { rejectUnauthorized: false } : false
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

// Creates entire schema needed for application
async function createTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
            id VARCHAR(100) PRIMARY KEY,
            email VARCHAR(500),
            firstname VARCHAR(100),
            lastname VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
            role VARCHAR(10),
            preferrednotes JSONB,
            last_login TIMESTAMPTZ
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
            stock_ml DECIMAL(10, 2),
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
    status can be:
        -pending
        -mixing
        -ready
        -fulfilled
        -canceled 

    items are in format: 
    [
        {
            productType: "fragrance" OR "mix",
            productID: "1ebc47bf-515c-420c-aec3-71bfa38883d1:" (points to either products table or mixes table)
            quantity: 2
        },
        {
            productType: "fragrance" OR "mix",
            productID: "1ebc47bf-515c-420c-aec3-71bfa38883d1:" (points to either products table or mixes table)
            quantity: 1
        },
        ...
    ]
    */
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders(
            id VARCHAR(100) PRIMARY KEY,
            customerid VARCHAR(100),
            created TIMESTAMPTZ DEFAULT NOW(),
            items JSONB,
            total DECIMAL(10, 2),
            status VARCHAR(100) DEFAULT 'pending',
            cancelreason VARCHAR(500)
        )
    `);

    /*
    status can be:
        - saved  (user clicked Save Fragrance)
        - cart   (user clicked Add to Cart and stock was available)

    frag3_productid and frag3_pct are nullable 
    */
    await pool.query(`
        CREATE TABLE IF NOT EXISTS blends (
            id              VARCHAR(100)  PRIMARY KEY,
            userid          VARCHAR(100)  NOT NULL,
            frag1_productid VARCHAR(100)  NOT NULL,
            frag2_productid VARCHAR(100)  NOT NULL,
            frag3_productid VARCHAR(100),
            frag1_pct       SMALLINT      NOT NULL,
            frag2_pct       SMALLINT      NOT NULL,
            frag3_pct       SMALLINT,
            size_ml         SMALLINT      NOT NULL,
            status          VARCHAR(20)   NOT NULL DEFAULT 'saved',
            created         TIMESTAMPTZ   DEFAULT NOW()
        )
    `);
}


// decorator that ensures any query completes fully, otherwise undo changes
function prepareRollback(fn){
    return async (...args) => { 
        let client;
        try{
            client = await pool.connect();
            await client.query("BEGIN")
            const response = await fn(...args, client)
            await client.query("COMMIT")
            return response
        }catch(err){
            if (client) await client.query("ROLLBACK");
            if (!(err instanceof DBError)) return {success: false, message: "Uncaught error occurred", status: 500};
            return {success: false, message: err.message, status: err.code}
        }finally{
            if (client) await client.release()
        }
    }
}

/* 
DBError is needed for 2 things:
    1) include the status code too
    2) identify if an error is one that we created or not
*/  
class DBError extends Error{
    constructor(message, code=400){
        super(message)
        this.code = code;
    }
}

class Users{
    //This function will be useless for now
    //modifications made to make it match Ayman's lambda function 'omre-cognito-post-confirmation'
    // 
    // async createUser(options, client){
    //     const {id, email, firstname, lastname, preferrednotes} = options;

    //     const adminEmails = [
    //         '@omrefragrances.com',
    //         'zchriste16@gmail.com',
    //         'contact@aymannazir.com',
    //         'muradsaleh2022@gmail.com'
    //     ];

    //     //IMPORTANT: roles will mainly be decided via access tokens later, so the "role" field may be removed
    //     // Check if admin (later, there may be a mapping of roles rather than a simple isAdmin check)
    //     const isAdmin = adminEmails.some(admin => 
    //         admin.startsWith('@') ? email.endsWith(admin) : email === admin
    //     );   

    //     let result;
    //     const query = `INSERT INTO users (id, email, firstname, lastname, role, preferrednotes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
    //     try{
    //         result = await client.query(query, [id, email, firstname, lastname, isAdmin ? "admin" : "user", JSON.stringify(preferrednotes)]);
    //     }catch(err){
    //         console.error(err)
    //         return {success: false, message: "Failed to create user", status: 400}
    //     }
    //     return {success: true, data: {user: result.rows?.[0]}}
    // }

    
    async deleteUser(id, client){
        const query = `DELETE FROM users WHERE id = $1`
        try{
            await client.query(query, [id]);
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to delete user");
        }
        return {success: true}
    }
    
    //rate limiting (ex: max 200) not needed yet
    
    async getUsers(client){
        const query = `SELECT * FROM users`
        let users;

        try{
            const res = await client.query(query);
            users = res.rows
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get users");
        }
        return {success: true, data: {users}}
    }

    
    async getUser(id, client){
        const query = `SELECT * FROM users WHERE id = $1`
        
        let user;
        try{
            const res = await client.query(query, [id]);
            user = res.rows?.[0]
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get user")
        }
        return {success: true, data: {user}}
    }

    
    async updateLastLogin(id, client) {
        const query = `UPDATE users SET last_login = NOW() WHERE id = $1`;

        try {
            const res = await client.query(query, [id]);
            if (res.rowCount === 0) {
                throw new DBError("User not found", 404);
            }
        } catch (err) {
            console.error("Failed to update last_login:", err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update last_login")
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
    static modifiableFields = ["type", "name", "variation", "price", "images", "stock_ml", "notes", "description", "ishidden", "isfeatured"];
    static filterableFields = ["type", "name", "variation", "price", "notes", "stock_ml", "isfeatured"]
    
    async createProduct(options, client){
        const {type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden} = options;
        const id = uuidv4();

        // Validation
        if (!name || name.trim() === '') {
            throw new DBError('Product name is required')
        }
        if (!price || price <= 0) {
            throw new DBError('Valid price is required')
        }
        if (images.length === 0) {
            throw new DBError('1 image is required')
        }
        if (images.length > 5) {
            throw new DBError('Maximum of 10 images allowed')
        }
        // Ensure all URLs are from CloudFront
        const invalidUrls = images.filter(url => !url.startsWith(CLOUDFRONT_DOMAIN));
        if (invalidUrls.length > 0) {
            throw new DBError('All image URLs must be valid CloudFront URLs')
        }  
    
        let result;
        const query = `INSERT INTO products (id, type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;`;
        try{
            result = await client.query(query, [id, type, name, variation, price, JSON.stringify(images), stock_ml, JSON.stringify(notes), description, isfeatured, ishidden]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError('Failed to create product', 500)
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
    
    
    async deleteProduct(id, client){
        const query = `DELETE FROM products WHERE id = $1 RETURNING *`
        try{
            const result = await client.query(query, [id]);
            const images = result?.rows?.[0]?.images;
            for (let image of images){
                const key = image.split("/").at(-1);
                try{
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: key
                    }));
                }catch(err){
                    console.log(err)
                }

            } 
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to delete product");
        }
        return {success: true};
    }

    
    async getProducts(client){
        const query = `SELECT * FROM products;`
        let products;

        try{
            const res = await client.query(query);
            products = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get products")
        }
        return {success: true, data: {products}}
    }

    
    async getActiveProducts(client){
        const query = `SELECT * FROM products WHERE ishidden IS FALSE;`
        let products;

        try{
            const res = await client.query(query);
            products = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get active products")
        }
        return {success: true, data: {products}}
    }

    async getFilteredProducts(filters, client){
        if (Object.keys(filters).length <= 0){
            throw new DBError("At least 1 filter required");
        }

        let query = `SELECT * FROM products WHERE ishidden IS FALSE AND `
        let values = []

        //builds a cosntraint in query for each filter
        for (const filter of Object.keys(filters)){
            switch (filter){
                case "type":{
                    query += `type = $${values.length + 1} AND `
                    values.push(filters[filter])
                    break
                }
                case "name":{
                    query += `name ILIKE $${values.length + 1} AND `
                    values.push(`%${filters[filter]}%`)
                    break
                }   
                case "variation":{
                    query += `variation ILIKE ANY($${values.length + 1}) AND `
                    values.push(filters[filter].map(v => `${v}%`))
                    break
                }
                case "price":{
                    const [min, max] = filters[filter]

                    if (min === null && max === null){
                        continue
                    }
                    if (min !== null){
                        query += `price >= $${values.length + 1} AND `
                        values.push(min)
                    }
                    if (max !== null){
                        query += `price <= $${values.length + 1} AND `
                        values.push(max)
                    }
                    break
                }
                case "notes":{
                    query += `(notes -> 'top' ?| $${values.length + 1} OR notes -> 'heart' ?| $${values.length + 1} OR notes -> 'base' ?| $${values.length + 1}) AND `
                    values.push(filters[filter])
                    break
                }
                case "isfeatured":{
                    query += `isfeatured = $${values.length + 1} AND `
                    values.push(filters[filter])
                    break
                }
                default:{
                    throw new DBError(`${filter} is not a valid filter`);
                }
            }
        }
        //removes last 'AND '
        query = query.slice(0,-4);

        console.log(query)

        let products;
        try{
            const res = await client.query(query, values);
            products = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get filtered products")
        }
        return {success: true, data: {products}}
    }
    
    async getProduct(id, client){
        const query = `SELECT * FROM products WHERE id = $1;`;
        let product;

        try{
            const res = await client.query(query, [id]);
            product = res.rows[0]
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get product")
        }
        return {success: true, data: {product}}
    }

    /*
    Expects object of fields in need of updating
    Ex) options === {type: "10ml spray", price: 35.85}
    */
    
    async updateProduct(id, options, client) {
        const fields = Object.keys(options);
        const query = this.formatUpdateQuery(fields);
        if (!query){
            throw new DBError("Failed to form update product query")
        }
        try{
            await client.query(query, [...fields.map(f => typeof options[f] === "object" ? JSON.stringify(options[f]) : options[f]), id])
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update product")
        }
        return {success: true}
    }

    async increaseProductStock(id, quantity, client){
        try{
            const retrieveProductQuery = `SELECT * FROM products WHERE id = $1;`;
            const product = (await client.query(retrieveProductQuery, [id]))?.rows?.[0];
            if (!product){
                return {success: false, message: "Product does not exist", status: 400}
            }
            const size = Number(product?.variation?.split("ml")?.[0]);
            if (!size){
                return {success: false, message: "Invalid size for product", status: 400}
            }
            
            //only 40% of size is the stored oil. 
            const newSize = product.stock_ml + (quantity * size*.4)
            if (newSize < 0){
                return {success: false, message: "Negative new size", status: 400}
            }
            const updateProductQuery = `UPDATE products SET stock_ml = $1 WHERE id = $2;`;
            await client.query(updateProductQuery, [newSize, id])

        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to increase product stock", status: 400}
        }
        return {success: true}
    }

    async decreaseProductStock(id, quantity, client){
        try{
            const retrieveProductQuery = `SELECT * FROM products WHERE id = $1;`;
            const product = (await client.query(retrieveProductQuery, [id]))?.rows?.[0];
            if (!product){
                return {success: false, message: "Product does not exist", status: 400}
            }
            const size = Number(product?.variation?.split("ml")?.[0]);
            if (!size){
                return {success: false, message: "Invalid size for product", status: 400}
            }
            
            //only 40% of size is the stored oil. 
            const newSize = product.stock_ml - (quantity * size*.4)
            if (newSize < 0){
                return {success: false, message: "Negative new size", status: 400}
            }
            const updateProductQuery = `UPDATE products SET stock_ml = $1 WHERE id = $2;`;
            await client.query(updateProductQuery, [newSize, id])

        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to decrease product stock", status: 400}
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

    
    async createReview(options, client){
        const {customerid, productid, message, rating, images} = options;
        const id = uuidv4();

        let result;
        const query = `INSERT INTO reviews (id, customerid, productid, message, rating, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        try{
            result = await client.query(query, [id, customerid, productid, message, rating, JSON.stringify(images)]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to create review")
        }
        return {success: true, data: {review: result.rows?.[0]}}
    }

    
    async deleteReview(id, client){
        const query = `DELETE FROM reviews WHERE id = $1`
        try{
            await client.query(query, [id]);
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to delete review");
        }
        return {success: true}
    }

    
    async getProductReviews(productid, client){
        const query = `SELECT * FROM reviews WHERE productid = $1 ORDER BY created DESC`;
        let reviews;

        try{
            const res = await client.query(query, [productid]);
            reviews = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get product reviews")
        }
        return {success: true, data: {reviews}}
    }

    
    async getUserReviews(customerid, client){
        const query = `SELECT * FROM reviews WHERE customerid = $1 ORDER BY created DESC`;
        let reviews;
        try{
            const res = await client.query(query, [customerid]);
            reviews = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get user reviews")
        }
        return {success: true, data: {reviews}}
    }

    
    async getReviews(client){
        const query = `SELECT * FROM reviews ORDER BY created DESC`;
        let reviews;

        try{
            const res = await client.query(query);
            reviews = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get reviews")
        }
        return {success: true, data: {reviews}}
    }

    
    async updateReview(id, options, client){
        const fields = Object.keys(options);
        const query = this.formatUpdateQuery(fields);
        if (!query){
            throw new DBError("Failed to form update review query")
        }

        try{
            await client.query(query, [...fields.map(f => typeof options[f] === "object" ? JSON.stringify(options[f]) : options[f]), id])
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update review")
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

    constructor(){
        this.products = new Products();
    }

    async createOrder(options, client){
        const {customerid, items, total} = options;
        for (const item of items){
            //checks if an item contains the expected fields
            if (!item.hasOwn("productType") || !item.hasOwn("productID") || !item.hasOwn("quantity")){
                throw new DBError("Item does not contain required fields")
            }

            //reduce stock
            //this flow can definitely be optimized to do all products in 1 or 2 queries, but I do not know how at this moment.
            const result = await this.products.decreaseProductStock(item.productID, item.quantity, client);
            if (!result.success){
                throw new DBError("Failed to decrease product stock");
            }
        }

        let order;
        const query = `INSERT INTO orders (id, customerid, items, total) VALUES ($1, $2, $3, $4) RETURNING *;`;
        try{
            order = await client.query(query, [id, customerid, JSON.stringify(items), total]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to create order")
        }
        return {success: true, data: {order: order.rows?.[0]}}
    }

    //Should probably only be for development
    async deleteOrder(id, client){
        const query = `DELETE FROM orders WHERE id = $1`
        try{
            await client.query(query, [id]);
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to delete order")
        }
        return {success: true}
    }

    
    async cancelOrder(id, cancelreason, client){
        const query = `UPDATE orders SET status = 'canceled', cancelreason = $1 WHERE id = $2 AND status != 'canceled' RETURNING *;`;
        try{
            const order = (await client.query(query, [cancelreason, id]))?.rows?.[0];
            if (!order){
                throw new DBError("Order does not exist or already canceled.");
            }

            for (const item of order.items){
                //checks if an item contains the expected fields
                if (!item.hasOwn("productType") || !item.hasOwn("productID") || !item.hasOwn("quantity")){
                    throw new DBError("Item does not contain required fields")
                }

                //restore stock
                //this flow can definitely be optimized to do all products in 1 or 2 queries, but I do not know how at this moment.
                const result = await this.products.increaseProductStock(item.productID, item.quantity, client);
                if (!result.success){
                    throw new DBError("Failed to increase product stock");
                }
            }
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to cancel order")
        }
        return {success: true}
    }

    //This always promotes status, flow is ususally pending -> mixing -> ready ->  fulfilled, but may move backwards 
    //cancels deserve their own flow.
    async updateOrderStatus(id, status, client){
        if (!["pending", "mixing", "ready", "fulfilled"].includes(status)){
            throw new DBError("Unexpected status")
        }
        const query = `UPDATE orders SET status = ${status} WHERE id = $1`;
        try{
            await client.query(query, [id]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update order status")
        }
        return {success: true}
    }

    
    async getOrder(id, client){
        const query = `SELECT * FROM orders WHERE id = $1`
        let order;

        try{
            const res = await client.query(query, [id]);
            order = res.rows[0]
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get order")
        }
        return {success: true, data: {order}}
    }

    async getUserOrders(customerid, client){
        const query = `SELECT * FROM orders WHERE customerid = $1`
        let orders;

        try{
            const res = await client.query(query, [customerid]);
            orders = res.rows
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get customer orders")
        }
        return {success: true, data: {orders}}
    }
}

function validateBlendInput(options) {
    const { userid, frag1_productid, frag2_productid, frag3_productid, frag1_pct, frag2_pct, frag3_pct, size_ml } = options;

    if (!userid) throw new DBError("User not identified", 401);
    if (!frag1_productid || !frag2_productid) throw new DBError("At least 2 fragrances are required");
    if (frag1_productid === frag2_productid) throw new DBError("Fragrance 1 and 2 cannot be the same product");
    if (![30, 50].includes(Number(size_ml))) throw new DBError("Bottle size must be 30 or 50 ml");

    const hasThird = !!frag3_productid;
    if (hasThird && (frag3_pct === null || frag3_pct === undefined)) throw new DBError("3rd fragrance percentage is required");
    if (!hasThird && frag3_pct) throw new DBError("3rd fragrance product is required when a percentage is provided");

    const total = Number(frag1_pct) + Number(frag2_pct) + (hasThird ? Number(frag3_pct) : 0);
    if (total !== 100) throw new DBError(`Fragrance percentages must add up to 100%, currently: ${total}%`);
}

class Blends {

    constructor() {
        this.products = new Products();
    }

    /*
    Shared validation used by both saveBlend and addBlendToCart.
    Keeps both functions clean and consistent.
    */
    
    /*
    saveBlend — called when user clicks "Save Fragrance"
    No stock check. Just saves to DB with status = 'saved'. Later the user can order them from their blends history directly
    userid always comes from the token in the controller, never from req.body.
    */
    async saveBlend(options, client) {
        validateBlendInput(options);

        const {
            userid,
            frag1_productid,
            frag2_productid,
            frag3_productid = null,
            frag1_pct,
            frag2_pct,
            frag3_pct = null,
            size_ml
        } = options;

        const id = uuidv4();

        const query = `
            INSERT INTO blends (id, userid, frag1_productid, frag2_productid, frag3_productid, frag1_pct, frag2_pct, frag3_pct, size_ml, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'saved')
            RETURNING *;
        `;

        let result;
        try {
            result = await client.query(query, [
                id,
                userid,
                frag1_productid,
                frag2_productid,
                frag3_productid,
                Number(frag1_pct),
                Number(frag2_pct),
                frag3_pct !== null ? Number(frag3_pct) : null,
                Number(size_ml)
            ]);
        } catch (err) {
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to save blend");
        }

        return { success: true, data: { blend: result.rows?.[0] } };
    }

    /*
    addBlendToCart — called when user clicks "Add to Cart"

    Stock math:
        total_oil_ml  = size_ml * 0.40          (40% of the bottle is pure oil)
        oil_needed    = total_oil_ml * (pct/100) (that fragrance's share of the oil)
        check:  product.stock_ml >= oil_needed

    Example: 50ml bottle, frag1 at 60%, frag2 at 40%
        total_oil = 20ml which is 40% of 50ml
        frag1 needs 12ml → check stock_ml >= 12
        frag2 needs  8ml → check stock_ml >= 8

    If any fragrance is short → returns stockUnavailable (NOT saved, NOT an error)
    If all good              → saves with status = 'cart', returns "Blend Ready!"
    */
    async addBlendToCart(options, client) {
        validateBlendInput(options);

        const {
            userid,
            frag1_productid,
            frag2_productid,
            frag3_productid = null,
            frag1_pct,
            frag2_pct,
            frag3_pct = null,
            size_ml
        } = options;

        const total_oil_ml = Number(size_ml) * 0.40;

        // Build the list of fragrances to stock-check
        const fragsToCheck = [
            { productid: frag1_productid, pct: Number(frag1_pct) },
            { productid: frag2_productid, pct: Number(frag2_pct) },
        ];
        if (frag3_productid && frag3_pct !== null) {
            fragsToCheck.push({ productid: frag3_productid, pct: Number(frag3_pct) });
        }

        // Check stock for each fragrance
        for (const frag of fragsToCheck) {
            let product;
            try {
                const res = await client.query(`SELECT id, name, stock_ml FROM products WHERE id = $1;`, [frag.productid]);
                product = res.rows?.[0];
            } catch (err) {
                console.error(err);
                throw new DBError("Failed to check product stock");
            }

            if (!product) throw new DBError(`Product not found: ${frag.productid}`, 404);

            const oil_needed = total_oil_ml * (frag.pct / 100);

            if (Number(product.stock_ml) < oil_needed) {
                // Stock check failed — do NOT save, return a clean response
                return {
                    success: false,
                    stockUnavailable: true,
                    message: `"${product.name}" doesn't have enough stock for this blend. Save your blend to order when restocked.`
                };
            }
        }

        // All stock checks passed — save with status 'cart'
        const id = uuidv4();

        const query = `
            INSERT INTO blends (id, userid, frag1_productid, frag2_productid, frag3_productid, frag1_pct, frag2_pct, frag3_pct, size_ml, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'cart')
            RETURNING *;
        `;

        let result;
        try {
            result = await client.query(query, [
                id,
                userid,
                frag1_productid,
                frag2_productid,
                frag3_productid,
                Number(frag1_pct),
                Number(frag2_pct),
                frag3_pct !== null ? Number(frag3_pct) : null,
                Number(size_ml)
            ]);
        } catch (err) {
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to save blend to cart");
        }

        return {
            success: true,
            cartReady: true,
            message: "Blend Ready!",
            data: { blend: result.rows?.[0] }
        };
    }

    // Get all blends belonging to the logged in user
    async getUserBlends(userid, client) {
        const query = `SELECT * FROM blends WHERE userid = $1 ORDER BY created DESC;`;
        let blends;
        try {
            const res = await client.query(query, [userid]);
            blends = res.rows;
        } catch (err) {
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get user blends");
        }
        return { success: true, data: { blends } };
    }
}
    
/*
This ChatGPT provided function wraps all class methods in a function.
This is needed because JS does not have decorators.
*/
function wrapClassMethods(Class, wrap, exclude=[]) {
  for (const key of Object.getOwnPropertyNames(Class.prototype)) {
    if (key === "constructor" || exclude.includes(key)) continue
    const fn = Class.prototype[key]
    if (typeof fn === "function") {
      Class.prototype[key] = wrap(fn)
    }
  }
}

// Will seek out a better way to do this. The exclude argument exists for any helper functions to avoid
// starting a nested "prepareRollback".
wrapClassMethods(Users, prepareRollback);
wrapClassMethods(Products, prepareRollback, ["increaseProductStock", "decreaseProductStock", "formatUpdateQuery"]);
wrapClassMethods(Reviews, prepareRollback, ["formatUpdateQuery"]);
wrapClassMethods(Orders, prepareRollback);
wrapClassMethods(Blends, prepareRollback);


module.exports = { Users, Products, Reviews, Orders, Blends }
