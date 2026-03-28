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
            parentid VARCHAR(100),
            type VARCHAR(100),
            name VARCHAR(1000),
            variation VARCHAR(200),
            price DECIMAL(10, 2),
            images JSONB,
            stock_ml DECIMAL(10, 2),
            notes JSONB,
            description TEXT,
            isfeatured BOOLEAN,
            ishidden BOOLEAN,
            created_at TIMESTAMP DEFAULT NOW()
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
            rating DECIMAL(10, 1),
            images JSONB DEFAULT '[]'::JSONB,
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

    //itemid will be an id from "products" or "blends"
    //type will be either "product" or "blend"
    await pool.query(`
        CREATE TABLE IF NOT EXISTS cart_items(
            id VARCHAR(100) PRIMARY KEY,
            customerid VARCHAR(100),
            itemid VARCHAR(100), 
            quantity INT,
            type VARCHAR(100),
            added TIMESTAMPTZ DEFAULT NOW()
        )
    `);

}


// decorator that ensures any query completes fully, otherwise undo changes
async function prepareRollback(fn){
    let client;
    try{
        client = await pool.connect();
        await client.query("BEGIN")
        const response = await fn(client)
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
    static filterableFields = ["email", "first_name", "last_name", "is_admin", "last_login"]

    //This function will be useless for now
    //modifications made to make it match Ayman's lambda function 'omre-cognito-post-confirmation'
    // 
    async createUser(options, client){
        if (!client){
            return prepareRollback((c) => this.createUser(options, c));
        }
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
            result = await client.query(query, [id, email, firstname, lastname, isAdmin ? "admin" : "user", JSON.stringify(preferrednotes)]);
        }catch(err){
            console.error(err)
            return {success: false, message: "Failed to create user", status: 400}
        }
        return {success: true, data: {user: result.rows?.[0]}}
    }

    
    async deleteUser(id, client){
        if (!client){
            return prepareRollback((c) => this.deleteUser(id, c));
        }
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
        if (!client){
            return prepareRollback((c) => this.getUsers(c));
        }
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
        if (!client){
            return prepareRollback((c) => this.getUser(id, c));
        }
        const query = `SELECT * FROM users WHERE cognito_sub = $1`;
        
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

    async getFilteredUsers(filters, client){
        if (!client){
            return prepareRollback((c) => this.getFilteredUsers(filters, c));
        }
        if (Object.keys(filters).length <= 0){
            throw new DBError("At least 1 filter required");
        }

        let query = `SELECT * FROM users WHERE `
        let values = []

        //builds a cosntraint in query for each filter
        for (const filter of Object.keys(filters)){
            switch (filter){
                case "email":{
                    query += `email ILIKE $${values.length + 1} AND `
                    values.push(`%${filters[filter]}%`)
                    break
                }
                case "first_name":{
                    query += `first_name ILIKE $${values.length + 1} AND `
                    values.push(`%${filters[filter]}%`)
                    break
                }
                case "last_name":{
                    query += `last_name ILIKE $${values.length + 1} AND `
                    values.push(`%${filters[filter]}%`)
                    break
                }
                case "is_admin":{
                    if (filters.is_admin){
                        query += `is_admin IS TRUE AND `
                    }else{
                        query += `is_admin IS FALSE AND `
                    }
                    break
                }
                case "last_login":{
                    if (filters.last_login){
                        query += `last_login IS NOT NULL AND `
                    }else{
                        query += `last_login IS NULL AND `
                    }
                    break
                }
                default:{
                    throw new DBError(`${filter} is not a valid filter`);
                }
            }
        }
        //removes last 'AND '
        query = query.slice(0,-4);


        let users;
        try{
            const res = await client.query(query, values);
            users = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get filtered users")
        }
        return {success: true, data: {users}}
    }
    
    async updateLastLogin(id, client) {
        if (!client){
            return prepareRollback((c) => this.updateLastLogin(id, c));
        }
        const query = `UPDATE users SET last_login = NOW() WHERE cognito_sub = $1 RETURNING *`;

        try {
            const res = await client.query(query, [id]);
            if (res.rowCount === 0) {
                throw new DBError("User not found", 404);
            }
        } catch (err) {
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update last_login")
        }
        return {success: true}
    }

    async updatePreferredNotes(id, preferrednotes, client) {
        if (!client){
            return prepareRollback((c) => this.updatePreferredNotes(id, preferrednotes, c));
        }
        const notesString = preferrednotes.join(", ");
        // Update the users favorite notes
        // const query = `UPDATE users SET favorite_notes = $1 WHERE cognito_sub = $2 RETURNING *;`;
        const query = `UPDATE users SET favorite_notes = $1 WHERE cognito_sub = $2 RETURNING *;`;
        let user;
        try{
            const res = await client.query(query, [notesString, id]);
            user = res.rows?.[0];
        }
        catch(err) {
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update preferred notes");
        }
        return { success: true, data: { user } };
    }
}

/*
Methods are designed based on flows. A user will modify different fields
in different situations (changePassword / updateLogin), but a product is 
likely updated in a single setting. Therefore, a single updateProduct is provided.
*/
class Products{
    static modifiableFields = ["type", "name", "variation", "price", "images", "notes", "description", "ishidden", "isfeatured"];
    static filterableFields = ["type", "name", "variation", "price", "notes", "stock_ml", "ishidden", "isfeatured",]
    
    async createProduct(options, client){
        if (!client){
            return prepareRollback((c) => this.createProduct(options, c));
        }
        const {parentid, type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden} = options;
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
        const query = `INSERT INTO products (id, parentid, type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;`;
        try{
            result = await client.query(query, [id, parentid ? parentid : uuidv4(), type, name, variation, price, JSON.stringify(images), stock_ml, JSON.stringify(notes), description, isfeatured, ishidden]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError('Failed to create product', 500)
        }
        
        // remove tags
        // this prevents images from being deleted after a period of time
        for (const url of images){
            const s3Key = url.replace(`${CLOUDFRONT_DOMAIN}/`, '');
            try {
                await s3Client.send(new DeleteObjectTaggingCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key
                }));
                console.log('Tag removed from:', s3Key);
            } catch (error) {
                console.log('Failed to remove tag:', url, error);
                throw new DBError("Failed to remove tag from: ", s3Key)
            }
        }

        return {success: true, data: {product: result.rows?.[0]}}
    }
    
    
    async deleteProduct(id, client){
        if (!client){
            return prepareRollback((c) => this.deleteProduct(id, c));
        }
        const query = `DELETE FROM products WHERE id = $1 RETURNING *`
        try{
            const result = await client.query(query, [id]);
            const images = result?.rows?.[0]?.images;
            for (let image of images){
                const key = image.replace(`${CLOUDFRONT_DOMAIN}/`, "");
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
        if (!client){
            return prepareRollback((c) => this.getProducts(c));
        }
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
        if (!client){
            return prepareRollback((c) => this.getActiveProducts(c));
        }
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
        if (!client){
            return prepareRollback((c) => this.getFilteredProducts(filters, c));
        }
        if (Object.keys(filters).length <= 0){
            throw new DBError("At least 1 filter required");
        }

        let query = `SELECT * FROM products WHERE `
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
                case "ishidden":{
                    query += `ishidden = $${values.length + 1} AND `
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
        if (!client){
            return prepareRollback((c) => this.getProduct(id, c));
        }
        const query = `SELECT * FROM products WHERE id = $1;`;
        let product;

        try{
            const res = await client.query(query, [id]);
            product = res.rows[0]
            if (!product){
                throw new DBError("Failed to get Product")
            }
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get product")
        }
        return {success: true, data: {product}}
    }

    async getRelatedProducts(parentid, client){
        if (!client){
            return prepareRollback((c) => this.getRelatedProducts(parentid, c));
        }
        const query = `SELECT * FROM products WHERE parentid = $1;`;
        let products;

        try{
            const res = await client.query(query, [parentid]);
            products = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get related products")
        }
        return {success: true, data: {products}}
    }

    /*
    Expects object of fields in need of updating
    Ex) options === {type: "10ml spray", price: 35.85}
    */
    
    async updateProduct(id, options, client) {
        if (!client){
            return prepareRollback((c) => this.updateProduct(id, options, c));
        }

        try{
            // form the update query
            const fields = Object.keys(options);
            const query = this.formatUpdateQuery(fields);

            if (!query){
                throw new DBError("Failed to form update product query");
            }

            // (if updating images) collect old images before update
            let oldImages = [];
            if (options.images){
                oldImages = (await client.query("SELECT images FROM products WHERE id = $1", [id]))?.rows?.[0]?.images
                if (!oldImages){
                    throw new DBError("Failed to get old images, or product doesn't exist");
                }

            }

            // make the actual product update
            const updateResult = await client.query(query, [...fields.map(f => typeof options[f] === "object" ? JSON.stringify(options[f]) : options[f]), id]);
            if (!updateResult?.rows?.[0]){
                throw new DBError("Failed to update product");
            }

            // (if updating images): removes tags from added images + deletes images no longer stored
            if (options.images){
                const newImages = options.images.filter(url => !oldImages.includes(url));
                const unusedImages = oldImages.filter(url => !options.images.includes(url));
                for (const image of newImages){
                    const s3Key = image.replace(`${CLOUDFRONT_DOMAIN}/`, '');
                    try {
                        await s3Client.send(new DeleteObjectTaggingCommand({
                            Bucket: BUCKET_NAME,
                            Key: s3Key
                        }));
                        console.log('Tag removed from:', s3Key);
                    } catch (error) {
                        console.error('Failed to remove tag from:', s3Key, error);
                        throw new DBError("Failed to remove temporary tag from uploaded image");
                    }
                }
                for (const image of unusedImages){
                    const s3Key = image.replace(`${CLOUDFRONT_DOMAIN}/`, '');
                    try{
                        await s3Client.send(new DeleteObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: s3Key
                        }));
                    }catch(err){
                        console.log(err)
                    }
                }
            }

        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update product")
        }
        return {success: true}
    }

    async updateProductStock(parentid, stock_ml, client) {
        if (!client){
            return prepareRollback((c) => this.updateProductStock(parentid, stock_ml, c));
        }

        try{
            const query = `UPDATE products SET stock_ml = $1 WHERE parentid = $2 RETURNING *;`;
            const updateResult = await client.query(query, [stock_ml, parentid]);
            if (!updateResult?.rows?.[0]){
                throw new DBError("Failed to update products");
            }
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update product stock.")
        }
        return {success: true}
    }

    async increaseProductStock(id, quantity, client){
        if (!client){
            return prepareRollback((c) => this.increaseProductStock(id, quantity, c));
        }
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
            const newSize = Number(product.stock_ml) + (quantity * size*.4)
            if (newSize < 0){
                return {success: false, message: "Negative new size", status: 400}
            }
            const updateProductQuery = `UPDATE products SET stock_ml = $1 WHERE parentid = $2;`;
            await client.query(updateProductQuery, [newSize, product.parentid])

        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to increase product stock", status: 400}
        }
        return {success: true}
    }

    async decreaseProductStock(id, quantity, client){
        if (!client){
            return prepareRollback((c) => this.decreaseProductStock(id, quantity, c));
        }

        try{
            const retrieveProductQuery = `SELECT * FROM products WHERE id = $1;`;
            const product = (await client.query(retrieveProductQuery, [id]))?.rows?.[0];

           if (!product){
                return {success: false, message: "Product does not exist", status: 400}
            }
            

            const size = Number(product?.variation?.toLowerCase().replace("ml", ""));
            if (!size){
                return {success: false, message: "Invalid size for product", status: 400}
            }

            const oilNeeded = quantity * size * 0.4;
            const newSize = Number(
                (Number(product.stock_ml) - oilNeeded).toFixed(2)
            );
            if (newSize < 0){
                return {success: false, message: "Not enough oil stock", status: 400}
            }
            const updateProductQuery = `
                UPDATE products 
                SET stock_ml = $1 
                WHERE parentid = $2 
                RETURNING stock_ml;
            `;
            const updateResult = await client.query(updateProductQuery, [newSize, product.parentid]);

            if (updateResult.rowCount === 0){
                return {success: false, message: "Failed to update stock", status: 400}
            }
        }catch(err){
            console.error("ACTUAL STOCK ERROR:", err);
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
        formattedQuery += ` WHERE id = $${i + 1} RETURNING *;`
        return formattedQuery
    }
}

class Reviews{
    static modifiableFields = ["rating", "message"] 
            // id VARCHAR(100) PRIMARY KEY,
            // customerid VARCHAR(100),
            // productid VARCHAR(100),
            // created TIMESTAMPTZ DEFAULT NOW(),
            // message VARCHAR(500), 
            // rating DECIMAL(10, 1),
            // images JSONB DEFAULT '[]'::JSONB,
            // responses JSONB DEFAULT '[]'::JSONB,
    
    async createReview(options, client){
        if (!client){
            return prepareRollback((c) => this.createReview(options, c));
        }
        const {customerid, productid, message, rating, images} = options;
        const id = uuidv4();

        if (rating < 1 || rating > 5){
            throw new DBError("Rating must be 1-5")
        }

        if (message.length > 500){
            throw new DBError("Message is too long")
        }

        if (images.length > 2) {
            throw new DBError('Maximum of 2 images allowed')
        }

        // TODO: CLOUDFRONT domain is fixed with '/products', fix later.
        // Ensure all URLs are from CloudFront
        const invalidUrls = images.filter(url => !url.startsWith(CLOUDFRONT_DOMAIN));
        if (invalidUrls.length > 0) {
            throw new DBError('All image URLs must be valid CloudFront URLs')
        }  

        let result;
        const query = `INSERT INTO reviews (id, customerid, productid, message, rating, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        try{
            result = await client.query(query, [id, customerid, productid, message, rating, JSON.stringify(images)]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to create review")
        }

        // remove tags
        // this prevents images from being deleted after a period of time
        for (const url of images){
            const s3Key = url.replace(`${CLOUDFRONT_DOMAIN}/`, '');
            try {
                await s3Client.send(new DeleteObjectTaggingCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key
                }));
                console.log('Tag removed from:', s3Key);
            } catch (error) {
                console.log('Failed to remove tag:', url, error);
                throw new DBError("Failed to remove tag from: ", s3Key)
            }
        }

        return {success: true, data: {review: result.rows?.[0]}}
    }

    
    async deleteReview(id, client){
        if (!client){
            return prepareRollback((c) => this.deleteReview(id, c));
        }
        
        try{
            const query = `DELETE FROM reviews WHERE id = $1 RETURNING *`
            const result = await client.query(query, [id]);
            const images = result?.rows?.[0]?.images;
            for (let image of images){
                const key = image.replace(`${CLOUDFRONT_DOMAIN}/`, "");
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
            throw new DBError("Failed to delete review");
        }
        return {success: true}
    }

    
    async getProductReviews(parentid, client){
        if (!client){
            return prepareRollback((c) => this.getProductReviews(parentid, c));
        }
        const query = `
        SELECT reviews.*, row_to_json(users) AS user
        FROM reviews 
        JOIN users ON reviews.customerid = users.cognito_sub 
        WHERE reviews.productid = $1
        ORDER BY created DESC`
        let reviews;

        try{
            const res = await client.query(query, [parentid]);
            reviews = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get product reviews")
        }
        return {success: true, data: {reviews}}
    }

    
    async getUserReviews(customerid, client){
        if (!client){
            return prepareRollback((c) => this.getUserReviews(customerid, c));
        }
        const query = `
        SELECT reviews.*, row_to_json(users) AS user
        FROM reviews 
        JOIN users ON reviews.customerid = users.cognito_sub 
        WHERE reviews.customerid = $1
        ORDER BY created DESC`
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
        if (!client){
            return prepareRollback((c) => this.getReviews(c));
        }
        const query = `
        SELECT reviews.*, row_to_json(users) AS user
        FROM reviews 
        JOIN users ON reviews.customerid = users.cognito_sub 
        ORDER BY created DESC`
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

    async respondToReview(id, response, client){
        if (!client){
            return prepareRollback((c) => this.respondToReview(id, response, c));
        }
        const {isadmin, message} = response;
        if (isadmin === null || message === null){
            throw new DBError("Invalid response format");
        }
        if (message.length > 500){
            throw new DBError("Response message is too long");
        }

        try{
            const newResponse = JSON.stringify([{isadmin, message}])
            const query = `
            UPDATE reviews 
            SET responses = responses || $1::jsonb
            WHERE id = $2
            RETURNING *`;

            const result = await client.query(query, [newResponse, id]);
            if (!result?.rows?.[0]){
                throw new DBError("Failed to respond to review");
            }
            if (result.rows[0].responses.length > 20 && !isadmin){
                throw new DBError("Conversation has gotten too long to respond")
            }

        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to respond to review")
        }
        return {success: true}
    }

    async updateReview(id, options, client){
        if (!client){
            return prepareRollback((c) => this.updateReview(id, options, c));
        }

        try{
            // form the update query
            const fields = Object.keys(options);
            const query = this.formatUpdateQuery(fields);

            if (!query){
                throw new DBError("Failed to form update review query")
            }

            // make the actual review update
            const updateResult = await client.query(query, [...fields.map(f => typeof options[f] === "object" ? JSON.stringify(options[f]) : options[f]), id])
            if (!updateResult?.rows?.[0]){
                throw new DBError("Failed to update review");
            }

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
    static filterableFields = ["email",]

    constructor(){
        this.products = new Products();
        this.blends = new Blends()
        this.cartItems = new CartItems()
    }

    async createOrder(customerid, client){
        if (!client){
            return prepareRollback((c) => this.createOrder(customerid, c));
        }
        let order;
        try{
            const cart = (await this.cartItems.getCart(customerid, client))?.data?.cart
            if (!cart){
                throw new DBError("Failed to get cart");
            }
            if (cart.length === 0){
                throw new DBError("Can't create an order with empty cart");
            }
            const items = [];
            let total = 0; 
            for (const {itemid, quantity, type, item} of cart){
                if (type !== "product" && type !== "blend"){
                    throw new DBError("Unexpected item type");
                }
                if (type === "product"){
                    //this flow can probably be optimized to do all products in 1 or 2 queries, but this is simplest
                    const result = await this.products.decreaseProductStock(itemid, quantity, client);
                    if (!result.success){
                        throw new DBError("Failed to decrease product stock");
                    }
                    total += Number(item.price) * quantity

                }else{ 
                    const result = await this.blends.decreaseBlendStock(itemid, quantity, client);
                    if (!result.success){
                        throw new DBError("Failed to decrease blend stock");
                    }

                    const blendRes = await client.query(
                        `SELECT size_ml FROM blends WHERE id = $1`,
                        [itemid]
                    );

                    const blend = blendRes.rows[0];
                    if (!blend){
                        throw new DBError("Blend not found");
                    }

                    const size_ml = blend.size_ml;

                    let blendPrice = 0;
                    if (size_ml === 30) blendPrice = 50;
                    else if (size_ml === 50) blendPrice = 75;
                    else throw new DBError(`Unsupported blend size: ${size_ml}ml`);

                    total += blendPrice * quantity;
                }
                items.push({itemid, quantity, type, item})
            }
            const id = uuidv4()
            const query = `INSERT INTO orders (id, customerid, items, total) VALUES ($1, $2, $3, $4) RETURNING *;`;
            order = (await client.query(query, [id, customerid, JSON.stringify(items), total])).rows[0];
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to create order")
        }
        return {success: true, data: {order}}
    }

    //Should probably only be for development
    async deleteOrder(id, client){
        if (!client){
            return prepareRollback((c) => this.deleteOrder(id, c));
        }

        try{
            const order = (await this.getOrder(id, client))?.data?.order;
            if (!order){
                throw new DBError("Couldn't find order before deletion");
            }
            if (order.status !== "canceled" && order.status !== "fulfilled"){
                const cancelOrderRes = await this.cancelOrder(id, "dev reasons", client);
                if (!cancelOrderRes.success){
                    throw new DBError("Failed to cancel order / restore stock before deletion")
                }
            }

            const query = `DELETE FROM orders WHERE id = $1`
            await client.query(query, [id]);
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to delete order")
        }
        return {success: true}
    }

    async cancelOrder(id, cancelreason, client){
        if (!client){
            return prepareRollback((c) => this.cancelOrder(id, cancelreason, c));
        }
        try{
            const query = `UPDATE orders SET status = 'canceled', cancelreason = $1 WHERE id = $2 AND status != 'canceled' RETURNING *;`;
            const order = (await client.query(query, [cancelreason, id]))?.rows?.[0];
            if (!order){
                throw new DBError("Order does not exist or already canceled.");
            }

            //If a product, blend, or products used in a blend don't exist, we continue because items that don't exist don't need their stock restored
            for (const {itemid, quantity, type} of order.items){
                if (type === "product"){
                    const result = await this.products.increaseProductStock(itemid, quantity, client);
                    if (!result.success && result.message !== "Product does not exist"){
                        throw new DBError("Failed to increase product stock");
                    }
                }else{
                    const result = await this.blends.increaseBlendStock(itemid, quantity, client);
                    if (!result.success && (result.message !== "Blend does not exist" && result.message !== "Failed to retrieve products") ){
                        throw new DBError("Failed to increase blend stock");
                    }
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
        if (!client){
            return prepareRollback((c) => this.updateOrderStatus(id, status, c));
        }
        if (!["pending", "mixing", "ready", "fulfilled"].includes(status)){
            throw new DBError("Unexpected status")
        }
        const query = `UPDATE orders SET status = $1 WHERE id = $2`;
        try{
            await client.query(query, [status, id]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update order status")
        }
        return {success: true}
    }

    
    async getOrder(id, client){
        if (!client){
            return prepareRollback((c) => this.getOrder(id, c));
        }
        const query = `
        SELECT orders.*, users.email
        FROM orders 
        JOIN users ON orders.customerid = users.cognito_sub 
        WHERE orders.id = $1`

        let order;
        try{
            const res = await client.query(query, [id]);
            order = res.rows[0];
            if (order?.items) {
                if (typeof order.items === "string") {
                    order.items = JSON.parse(order.items);
                }
                order.items = await this.addBlendNames(order.items, client);
            }
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get order")
        }
        return {success: true, data: {order}}
    }

    async getUserOrders(customerid, client){
        if (!client){
            return prepareRollback((c) => this.getUserOrders(customerid, c));
        }

        const query = `
        SELECT orders.*, users.email
        FROM orders 
        JOIN users ON orders.customerid = users.cognito_sub 
        WHERE orders.customerid = $1`
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

    async getOrders(client){
        if (!client){
            return prepareRollback((c) => this.getOrders(c));
        }
        try{
            const query = `SELECT * FROM orders ORDER BY created DESC`;
            const res = await client.query(query);
            const orders = res.rows;
            for (const order of orders) {
                if (order?.items) {
                    if (typeof order.items === "string") {
                        order.items = JSON.parse(order.items);
                    }
                    order.items = await this.addBlendNames(order.items, client);
                }
            }
            return {success: true, data: {orders}};
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get orders");
        }
    }

    async getFilteredOrders(filters, client){
        if (!client){
            return prepareRollback((c) => this.getFilteredOrders(filters, c));
        }
        if (Object.keys(filters).length <= 0){
            throw new DBError("At least 1 filter required");
        }

        let query = `
        SELECT orders.*, users.email
        FROM orders 
        JOIN users ON orders.customerid = users.cognito_sub 
        WHERE `

        let values = []

        //builds a constraint in query for each filter
        for (const filter of Object.keys(filters)){
            switch (filter){
                case "email":{
                    query += `users.email ILIKE $${values.length + 1} AND `
                    values.push(`%${filters[filter]}%`)
                    break
                }
                case "id":{
                    query += `orders.id ILIKE $${values.length + 1} AND `
                    values.push(`%${filters[filter]}%`)
                    break
                }
                default:{
                    throw new DBError(`${filter} is not a valid filter`);
                }
            }
        }
        //removes last 'AND '
        query = query.slice(0,-4);


        let orders;
        try{
            const res = await client.query(query, values);
            orders = res.rows;
        }catch(err){
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get filtered orders")
        }
        return {success: true, data: {orders}}
    }
    

    async addBlendNames(items, client) {
        if (!items) return items;
        for (const orderItem of items) {
            if (orderItem.type === "blend") {
                const blend = orderItem.item;
                const ids = [
                    blend.frag1_productid,
                    blend.frag2_productid,
                    blend.frag3_productid
                ].filter(Boolean);

                if (ids.length === 0) continue;
                const res = await client.query(
                    `SELECT id, name FROM products WHERE id = ANY($1)`,
                    [ids]
                );
                const map = {};

                for (const p of res.rows) {
                    map[p.id] = p.name;
                }
                blend.frag1_name = map[blend.frag1_productid];
                blend.frag2_name = map[blend.frag2_productid];
                blend.frag3_name = map[blend.frag3_productid];
            }
        }
        return items;
    }
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
        if (!client){
            return prepareRollback((c) => this.saveBlend(options, c));
        }
        this.validateBlendInput(options);

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


    // In your Blends class
async getBlendById(blendid, client) {
    if (!client) {
        return prepareRollback((c) => this.getBlendById(blendid, c));
    }

    const query = `SELECT * FROM blends WHERE id = $1;`;
    try {
        const res = await client.query(query, [blendid]);
        const blend = res.rows?.[0];
        if (!blend) {
            return { success: false, message: "Blend not found", status: 404 };
        }
        return { success: true, data: { blend } };
    } catch (err) {
        console.error(err);
        return { success: false, message: "Failed to retrieve blend", status: 500 };
    }
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

    // Get all blends belonging to the logged in user
    async getUserBlends(userid, client) {
        if (!client){
            return prepareRollback((c) => this.getUserBlends(userid, c));
        }
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

    // Delete user created blend by blendid.
    async deleteUserBlend(userid, blendid, client) {
        if (!client){
            return prepareRollback((c) => this.deleteUserBlend(userid, blendid, c));
        }
        // Only deletes if the blend belongs to the user
        const query = `DELETE FROM blends WHERE userid = $1 AND id = $2 RETURNING *;`;
        let deleted;
        try {
            const res = await client.query(query, [userid, blendid]);
            deleted = res.rows?.[0];
            // If no rows were deleted, it means either the blend doesn't exist or doesn't belong to the user
            if (!deleted) {
                return { success: false, status: 404, message: "Blend not found" };
            }
        } 
        catch (err) {
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to delete blend");
        }
        // Successfully deleted the blend
        return { success: true, data: { blend: deleted } };
    }

    // increases stock per ingredient 
    // returns price for convenience
    async increaseBlendStock(id, quantity, client){
        if (!client){
            return prepareRollback((c) => this.increaseBlendStock(id, quantity, c));
        }
        let price = 0;
        try{
            const retrieveBlendQuery = `SELECT * FROM blends WHERE id = $1;`;
            const blend = (await client.query(retrieveBlendQuery, [id]))?.rows?.[0];
            if (!blend){
                return {success: false, message: "Blend does not exist", status: 400} //Do not change error message
            }
            blend.frag1_pct /= 100;
            blend.frag2_pct /= 100;
            if (blend.frag3_productid) blend.frag3_pct /= 100;
            const oil = blend.size_ml * .4;

            const productIds = [blend.frag1_productid, blend.frag2_productid];
            if (blend.frag3_productid) productIds.push(blend.frag3_productid);

            const getProductsUsedQuery = `SELECT * FROM products WHERE id = ANY($1) ORDER BY array_position($1, id);`;
            const productsUsed = (await client.query(getProductsUsedQuery, [productIds]))?.rows;

            if (!productsUsed || (blend.frag3_productid && productsUsed.length !== 3) || (!blend.frag3_productid && productsUsed.length !== 2)){
                throw new DBError("Failed to retrieve products"); //Do not change error message
            }

            const newProductSizes = [Number(productsUsed[0].stock_ml) + (quantity * oil * blend.frag1_pct), Number(productsUsed[1].stock_ml) + (quantity * oil * blend.frag2_pct)]
            if (blend.frag3_productid) newProductSizes.push(Number(productsUsed[2].stock_ml) + (quantity * oil * blend.frag3_pct))
            for (const size of newProductSizes){
                if (size < 0) throw new DBError("Not enough stock for this blend");
            }
            
            const productUpdateQuery = `UPDATE products SET stock_ml = $1 WHERE parentid = $2 RETURNING *`;
            const product1UpdateRes = (await client.query(productUpdateQuery, [newProductSizes[0], productsUsed[0].parentid]))?.rows?.[0];
            if (!product1UpdateRes) throw new DBError(`Failed to update blend product 1 with parentid ${productsUsed[0].parentid}`)
            const product2UpdateRes = (await client.query(productUpdateQuery, [newProductSizes[1], productsUsed[1].parentid]))?.rows?.[0];
            if (!product2UpdateRes) throw new DBError(`Failed to update blend product 2 with parentid ${productsUsed[1].parentid}`)
            if (blend.frag3_productid){
                const product3UpdateRes = (await client.query(productUpdateQuery, [newProductSizes[2], productsUsed[2].parentid]))?.rows?.[0];
                if (!product3UpdateRes) throw new DBError(`Failed to update blend product 3 with parentid ${productsUsed[2].parentid}`)
            }   


            const pricePerML1 = (Number(productsUsed[0].price) / Number(productsUsed[0].variation.split("ml")?.[0]));
            price += pricePerML1 * (blend.size_ml * blend.frag1_pct);

            const pricePerML2 = (Number(productsUsed[1].price) / Number(productsUsed[1].variation.split("ml")?.[0]));
            price += pricePerML2 * (blend.size_ml * blend.frag2_pct)
            
            if (blend.frag3_productid){
                const pricePerML3 = (Number(productsUsed[2].price) / Number(productsUsed[2].variation.split("ml")?.[0]));
                price += pricePerML3 * (blend.size_ml * blend.frag3_pct)
            }
            price *= quantity
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to increase blend stock", status: 400}
        }
        return {success: true, data: {price}}
    }

    // decreases stock per ingredient 
    // returns price for convenience
    async decreaseBlendStock(id, quantity, client){
        if (!client){
            return prepareRollback((c) => this.decreaseBlendStock(id, quantity, c));
        }
        let price = 0;
        try{
            const retrieveBlendQuery = `SELECT * FROM blends WHERE id = $1;`;
            const blend = (await client.query(retrieveBlendQuery, [id]))?.rows?.[0];
            if (!blend){
                return {success: false, message: "Blend does not exist", status: 400}
            }
            blend.frag1_pct /= 100;
            blend.frag2_pct /= 100;
            if (blend.frag3_productid) blend.frag3_pct /= 100;

            const oil = blend.size_ml * .4;

            const productIds = [blend.frag1_productid, blend.frag2_productid];
            if (blend.frag3_productid) productIds.push(blend.frag3_productid);

            const getProductsUsedQuery = `SELECT * FROM products WHERE id = ANY($1) ORDER BY array_position($1, id);`;
            const productsUsed = (await client.query(getProductsUsedQuery, [productIds]))?.rows;

            if (!productsUsed || (blend.frag3_productid && productsUsed.length !== 3) || (!blend.frag3_productid && productsUsed.length !== 2)){
                throw new DBError("Failed to retrieve products for decreasing blend");
            }

            const newProductSizes = [Number(productsUsed[0].stock_ml) - (quantity * oil * blend.frag1_pct), Number(productsUsed[1].stock_ml) - (quantity * oil * blend.frag2_pct)]
            if (blend.frag3_productid) newProductSizes.push(Number(productsUsed[2].stock_ml) - (quantity * oil * blend.frag3_pct))
            for (const size of newProductSizes){
                if (size < 0) throw new DBError("Not enough stock for this blend");
            }
            
            const productUpdateQuery = `UPDATE products SET stock_ml = $1 WHERE id = $2 RETURNING *`;
            const product1UpdateRes = (await client.query(productUpdateQuery, [newProductSizes[0], blend.frag1_productid]))?.rows?.[0];
            if (!product1UpdateRes) throw new DBError(`Failed to update blend product 1 with id ${blend.frag1_productid}`)
            const product2UpdateRes = (await client.query(productUpdateQuery, [newProductSizes[1], blend.frag2_productid]))?.rows?.[0];
            if (!product2UpdateRes) throw new DBError(`Failed to update blend product 2 with id ${blend.frag2_productid}`)
            if (blend.frag3_productid){
                const product3UpdateRes = (await client.query(productUpdateQuery, [newProductSizes[2], blend.frag3_productid]))?.rows?.[0];
                if (!product3UpdateRes) throw new DBError(`Failed to update blend product 3 with id ${blend.frag3_productid}`)
            }

            const pricePerML1 = (Number(productsUsed[0].price) / Number(productsUsed[0].variation.split("ml")?.[0]));
            price += pricePerML1 * (blend.size_ml * blend.frag1_pct);

            const pricePerML2 = (Number(productsUsed[1].price) / Number(productsUsed[1].variation.split("ml")?.[0]));
            price += pricePerML2 * (blend.size_ml * blend.frag2_pct)
            
            if (blend.frag3_productid){
                const pricePerML3 = (Number(productsUsed[2].price) / Number(productsUsed[2].variation.split("ml")?.[0]));
                price += pricePerML3 * (blend.size_ml * blend.frag3_pct)
            }
            price *= quantity
        }catch(err){
            console.error(err);
            return {success: false, message: "Failed to decrease blend stock", status: 400}
        }
        return {success: true, data: {price}}
    }

    validateBlendInput(options) {
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
}

class CartItems{
        // CREATE TABLE IF NOT EXISTS cart_items(
        //     id VARCHAR(100) PRIMARY KEY,
        //     customerid VARCHAR(100),
        //     itemid VARCHAR(100), 
        //     quantity INT,
        //     added TIMESTAMPTZ DEFAULT NOW(),

    // may simply increment quantity if item exists
    async createCartItem(options, client){
        if (!client){
            return prepareRollback((c) => this.createCartItem(options, c));
        }
        const {customerid, itemid, type} = options;
        const id = uuidv4();

        // Blend stock check — product path below is completely untouched
        if (type === "blend") {
            let blend;
            try {
                const blendRes = await client.query(`SELECT * FROM blends WHERE id = $1;`, [itemid]);
                blend = blendRes.rows?.[0];
            } catch (err) {
                console.error(err);
                throw new DBError("Failed to fetch blend for stock check");
            }

            if (!blend) throw new DBError("Blend not found", 404);

            const total_oil_ml = Number(blend.size_ml) * 0.40;
            const fragsToCheck = [
                { productid: blend.frag1_productid, pct: Number(blend.frag1_pct) },
                { productid: blend.frag2_productid, pct: Number(blend.frag2_pct) },
            ];
            if (blend.frag3_productid) {
                fragsToCheck.push({ productid: blend.frag3_productid, pct: Number(blend.frag3_pct) });
            }

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
                    return {
                        success: false,
                        stockUnavailable: true,
                        message: `"${product.name}" doesn't have enough stock for this blend. Save your blend to order when restocked.`
                    };
                }
            }
        }

        let result;
        try{
            const getCartQuery = `SELECT itemid FROM cart_items WHERE customerid = $1;`;
            const cart = (await client.query(getCartQuery, [customerid]))?.rows;

            const itemExists = cart.some(entry => entry.itemid === itemid);

            if (!itemExists){
                const query = `INSERT INTO cart_items (id, customerid, itemid, quantity, type) VALUES ($1, $2, $3, 1, $4) RETURNING *;`;
                result = await client.query(query, [id, customerid, itemid, type]);
            }else{
                const query = `UPDATE cart_items SET quantity = quantity + 1 WHERE customerid = $1 AND itemid = $2 RETURNING *;`;
                result = await client.query(query, [customerid, itemid]);
            }
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to create cart item")
        }
        return {success: true, data: {cartItem: result.rows[0]}}
    }

    async deleteCartItem(id, client){
        if (!client){
            return prepareRollback((c) => this.deleteCartItem(id, c));
        }
        try{
            const getCartItem = `SELECT quantity FROM cart_items WHERE id = $1;`;
            const cartItem = (await client.query(getCartItem, [id]))?.rows?.[0];
            if (!cartItem){
                return {success: true}
            }

            if (cartItem.quantity <= 1){
                const query = `DELETE FROM cart_items WHERE id = $1;`;
                await client.query(query, [id]);
            }else{
                const query = `UPDATE cart_items SET quantity = quantity - 1 WHERE id = $1 ;`;
                await client.query(query, [id]);
            }
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to either delete cart item or decrement quantity")
        }
        return {success: true}
    }

    /*
    returns a list of objects in the form:
    {
        id,
        customerid,
        itemid,
        quantity, 
        added,
        item: the actual product or blend info
    } 
     */
    async getCart(customerid, client){
        if (!client){
            return prepareRollback((c) => this.getCart(customerid, c));
        }
        const result = [];
        try{
            const getCartQuery = `SELECT * FROM cart_items WHERE customerid = $1;`;
            const cart = await client.query(getCartQuery, [customerid]);
            //get the actual products/blends
            for (const item of cart.rows){
                try{
                    const query = item.type === "product" ? `SELECT * FROM products WHERE id = $1` : `SELECT * FROM blends WHERE id = $1` 
                    const itemRes = (await client.query(query, [item.itemid])).rows[0]
                    result.push({
                        ...item,
                        item: itemRes
                    })
                }catch(err){
                    //TODO: when a product doesn't exist anymore, maybe we let client know
                    continue
                }
            }
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get cart items")
        }

        return {success: true, data: {cart: result}}
    }

    //removes all existing cart items and add these items
    async updateCart(customerid, items, client){
        if (!client){
            return prepareRollback((c) => this.updateCart(customerid, items, c));
        }
        const result = [];
        try{
            const emptyCartQuery = `DELETE FROM cart_items WHERE customerid = $1;`;
            await client.query(emptyCartQuery, [customerid]);

            for (const item of items){
                if ((!item.quantity || item.quantity <= 0) || !item.itemid || !item.type){
                    throw new DBError("Invalid cart item. A quantity, item id, and type is required");
                }
                const id = uuidv4()
                const insertQuery = `INSERT INTO cart_items (id, customerid, itemid, quantity, type) VALUES ($1, $2, $3, $4, $5) RETURNING *;`
                const insertResult = await client.query(insertQuery, [id, customerid, item.itemid, item.quantity, item.type]);
                result.push(insertResult.rows[0]);
            }
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to update cart");
        }
        return {success: true, data: {cart: result}}
    }

    async clearCart(customerid, client){
        if (!client){
            return prepareRollback((c) => this.clearCart(customerid, c));
        }
        try{
            const emptyCartQuery = `DELETE FROM cart_items WHERE customerid = $1;`;
            await client.query(emptyCartQuery, [customerid]);
        }catch(err){
            console.error(err)
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to clear cart");
        }
        return {success: true}
    }
}

class Recommendations {

    async getRecommendations(userid, client) {
        if (!client) {
            return prepareRollback((c) => this.getRecommendations(userid, c));
        }

        try {
            const noteScores = {};

            // seenProductIds is rebuilt fresh every call — never stored permanently.
            // If a user removes a product from cart or deletes a blend, 
            // that product becomes recommendable again on the next call.

            const seenProductIds = new Set();

            const addScore = (note, points) => {
                if (!note || typeof note !== "string") return;
                const key = note.toLowerCase().trim();
                noteScores[key] = (noteScores[key] || 0) + points;
            };

            const flattenNotes = (notes) => {
                if (!notes || typeof notes !== "object") return [];
                return [
                    ...(Array.isArray(notes.top)   ? notes.top   : []),
                    ...(Array.isArray(notes.heart)  ? notes.heart : []),
                    ...(Array.isArray(notes.base)   ? notes.base  : []),
                ];
            };

            const getProductNotes = async (productid) => {
                if (!productid) return [];
                try {
                    const res = await client.query(`SELECT notes FROM products WHERE id = $1;`, [productid]);
                    return flattenNotes(res.rows?.[0]?.notes);
                } catch { return []; }
            };

            // Marks all component fragrances of a blend as seen
            const markBlendSeen = (blend) => {
                if (blend.frag1_productid) seenProductIds.add(blend.frag1_productid);
                if (blend.frag2_productid) seenProductIds.add(blend.frag2_productid);
                if (blend.frag3_productid) seenProductIds.add(blend.frag3_productid);
            };

            const scoreBlend = async (blend, basePoints) => {
                const frags = [
                    { productid: blend.frag1_productid, pct: Number(blend.frag1_pct) },
                    { productid: blend.frag2_productid, pct: Number(blend.frag2_pct) },
                ];
                if (blend.frag3_productid) {
                    frags.push({ productid: blend.frag3_productid, pct: Number(blend.frag3_pct) });
                }
                for (const frag of frags) {
                    const notes = await getProductNotes(frag.productid);
                    const weightedPoints = basePoints * (frag.pct / 100);
                    for (const note of notes) addScore(note, weightedPoints);
                }
            };

            // RANK 1: Favourite notes from signup — 8pts flat per note
            
            try {
                const userRes = await client.query(`SELECT favorite_notes FROM users WHERE cognito_sub = $1;`, [userid]);
                const favNotesRaw = userRes.rows?.[0]?.favorite_notes || "";
                const favNotes = favNotesRaw.split(",").map(n => n.trim()).filter(Boolean);
                for (const note of favNotes) addScore(note, 8);
            } catch {}

            // RANK 2: Ordered fragrances and blends — 6pts
           
            try {
                const ordersRes = await client.query(
                    `SELECT items FROM orders WHERE customerid = $1 AND status != 'canceled';`,
                    [userid]
                );
                for (const order of ordersRes.rows) {
                    const items = Array.isArray(order.items) ? order.items : [];
                    for (const item of items) {
                        if (item.type === "product" && item.itemid) {
                            seenProductIds.add(item.itemid);
                            const notes = await getProductNotes(item.itemid);
                            for (const note of notes) addScore(note, 6);
                        } else if (item.type === "blend" && item.itemid) {
                            const blendRes = await client.query(`SELECT * FROM blends WHERE id = $1;`, [item.itemid]);
                            const blend = blendRes.rows?.[0];
                            if (blend) {
                                await scoreBlend(blend, 6);
                                markBlendSeen(blend);
                            }
                        }
                    }
                }
            } catch {}

            // RANK 3: Cart items — 4pts
           
            try {
                const cartRes = await client.query(`SELECT * FROM cart_items WHERE customerid = $1;`, [userid]);
                for (const cartItem of cartRes.rows) {
                    if (cartItem.type === "product" && cartItem.itemid) {
                        seenProductIds.add(cartItem.itemid);
                        const notes = await getProductNotes(cartItem.itemid);
                        for (const note of notes) addScore(note, 4);
                    } else if (cartItem.type === "blend" && cartItem.itemid) {
                        const blendRes = await client.query(`SELECT * FROM blends WHERE id = $1;`, [cartItem.itemid]);
                        const blend = blendRes.rows?.[0];
                        if (blend) {
                            await scoreBlend(blend, 4);
                            markBlendSeen(blend);
                        }
                    }
                }
            } catch {}

            // RANK 4: Saved blends — 2pts, percentage weighted
    
            try {
                const savedRes = await client.query(
                    `SELECT * FROM blends WHERE userid = $1;`,
                    [userid]
                );
                for (const blend of savedRes.rows) {
                    await scoreBlend(blend, 2);
                    markBlendSeen(blend);
                }
            } catch {}

            // Fetch all active products, exclude ones user already interacted with, score by note match
            const candidatesRes = await client.query(`SELECT * FROM products WHERE ishidden = false;`);
            const candidates = candidatesRes.rows.filter(p => !seenProductIds.has(p.id));

            const scored = candidates.map(product => {
                const productNotes = flattenNotes(product.notes);
                let score = 0;
                for (const note of productNotes) {
                    score += noteScores[note.toLowerCase().trim()] || 0;
                }
                score += Math.random() * 0.5; // tiny nudge so equal scores shuffle
                return { ...product, score };
            });

            scored.sort((a, b) => b.score - a.score);
            return { success: true, data: { recommendations: scored.slice(0, 4) } };

        } catch (err) {
            console.error(err);
            if (err instanceof DBError) throw err;
            throw new DBError("Failed to get recommendations", 500);
        }
    }
}
module.exports = { Users, Products, Reviews, Orders, Blends, CartItems, Recommendations }
