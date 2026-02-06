const { S3Client, PutObjectCommand, DeleteObjectTaggingCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require("uuid");
const {Users, Products, Reviews, Orders} = require("./config/db.js")

const dotenv = require("dotenv");
dotenv.config();

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

// access db resources
const users = Users.getUsersInstance()
const products = Products.getProductsInstance()
const reviews = Reviews.getReviewsInstance()
const orders = Orders.getOrdersInstance()



// General wrapper to prevent server crashing
function handleError(fn){
  return async (...args) => {
    try{
      return await fn(...args);
    }catch(err){
      console.error(err);
      const [req, res] = args
      return res.status(500).json({success: false});
    }
  };
}

// app.put("/users/login/:id", placeholder)

// path: GET /
function getServerHTML(req, res){
    res.send("Welcome to the server!");
};


// users

// path: GET /users/:id
async function getUser(req, res){
  const {id} = req.params;
  const result = await users.getUser(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get user"});
  }
  return res.json(result);
}

// path: GET /users
async function getUsers(req, res){
  const result = await users.getUsers();
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get users"});
  }
  return res.json(result);
}

// path: POST /users
async function createUser(req, res){
  const result = await users.createUser(req.body);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to create user"});
  }
  return res.json(result);
}

// path: DELETE /users/:id
async function deleteUser(req, res) {
  const {id} = req.params;
  const result = await users.deleteUser(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to delete user"});
  }
  return res.json(result)
}




//products

// path: GET /products/:id
async function getProduct(req, res) {
  const {id} = req.params;
  const result = await products.getProduct(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get product"});
  }
  return res.json(result)
}

// path: PUT /products/:id
async function updateProduct(req, res) {
  const {id} = req.params;
  const normalFields = JSON.parse(req.body.normalFields)
  const images = req.files.map(() => randomUrls[Math.floor(Math.random()*3)]);
  const options = normalFields.images ? {...normalFields, images} : normalFields 

  const result = await products.updateProduct(id, options);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to update product"});
  }
  return res.json(result)
}

// path: DELETE /products/:id
async function deleteProduct(req, res) {
  const {id} = req.params;
  const result = await products.deleteProduct(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to delete product"});
  }
  return res.json(result)
}

// path: GET /products/active
async function getActiveProducts(req, res) {
  const result = await products.getActiveProducts();
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get active products"});
  }
  return res.json(result)
}

// path: POST /products
async function createProduct(req, res) {
  const result = await products.createProduct(req.body);

  /*this singular function does not follow the pattern of null return as it is being updated 
  to include logic from Ayman's lambda function that he made following his own pattern.
  TODO: No null returns from DB functions. They should return the error/success message themselves. 
  */
  if (!result.success){
    const status = result.status;
    delete result.status
    return res.status(status).json(result);
  }
  return res.json(result)
}

// path: GET /products
async function getProducts(req, res) {
  const result = await products.getProducts();
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get products"});
  }
  return res.json(result)
}



// reviews

// path: GET /reviews/product/:productid
async function getProductReviews(req, res) {
  const {productid} = req.params;
  const result = await reviews.getProductReviews(productid);
  if (!result){
    res.status(500).json({success: false, message: "Failed to get product reviews"});
  }
  return res.json(result);
}

// path: GET /reviews/user/:customerid
async function getUserReviews(req, res) {
  const {customerid} = req.params;
  const result = await reviews.getUserReviews(customerid);
  if (!result){
    res.status(500).json({success: false, message: "Failed to get user's reviews"});
  }
  return res.json(result);
}

// path: PUT /reviews/:id
async function updateReview(req, res) {
  const {id} = req.params;
  const result = await reviews.updateReview(id, req.body);
  if (!result){
    res.status(500).json({success: false, message: "Failed to update product review"});
  }
  return res.json(result);
}

// path: GET /reviews
async function getReviews(req, res) {
  const result = await reviews.getReviews();
  if (!result){
    res.status(500).json({success: false, message: "Failed to get reviews"});
  }
  return res.json(result);
}

//TODO: images need special handling
// path: POST /reviews
async function createReview(req, res) {
  //TODO: make images S3 urls
  const normalFields = JSON.parse(req.body.normalFields)
  const images = req.files.map(() => randomUrls[Math.floor(Math.random()*3)]);

  const result = await reviews.createReview({...normalFields, images});
  if (!result){
    res.status(500).json({success: false, message: "Failed to create review"});
  }
  return res.json(result);
}

// path: DELETE /reviews/:id
async function deleteReview(req, res) {
  const {id} = req.params;
  const result = await reviews.deleteReview(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to delete review"});
  }
  return res.json(result)
}


// orders

//path: PUT /orders/cancel/:id
async function cancelOrder(req, res) {
  const {id} = req.params;
  const {cancelreason} = req.body;
  const result = await orders.cancelOrder(id, cancelreason);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to cancel order"});
  }
  return res.json(result);
}

//path: PUT /orders/complete/:id
async function completeOrder(req, res) {
  const {id} = req.params;
  const result = await orders.completeOrder(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to complete order"});
  }
  return res.json(result);
}

// path: GET /orders/:id
async function getOrder(req, res) {
  const {id} = req.params;
  const result = await orders.getOrder(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get order"});
  }
  return res.json(result);
}

// path: POST /orders
async function createOrder(req, res) {
  const result = await orders.createOrder(req.body);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to create order"});
  }
  return res.json(result);
}

// path: DELETE /orders/:id
async function deleteOrder(req, res) {
  const {id} = req.params;
  const result = await orders.deleteOrder(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to delete order"});
  }
  return res.json(result)
}

// miscellaneous

//This is ayman's code moved from Lambda and modified for this environment
// path: GET /uploadurl
async function getUploadURL(req, res) {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const PRESIGNED_URL_EXPIRATION = 1800; // 30 minutes

  const { filename, contentType, fileSize } = req.query;
    
  // Validation
  if (!filename || !contentType) {
    return res.status(400).json({success: false, message: "Missing filename or content type"});
  }
  
  if (!ALLOWED_TYPES.includes(contentType.toLowerCase())) {
    return res.status(400).json({success: false, message: "Invalid file type. Allowed: jpg, jpeg, png, webp"});
  }
  
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return res.status(400).json({success: false, message: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`});
  }
  
  // Generate unique S3 key
  const timestamp = Date.now();
  const randomId = uuidv4().split("-").join("");
  const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
  const s3Key = `products/${timestamp}-${randomId}-${sanitizedFilename}`;
      
  // Create presigned URL with temporary tagging
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
    Tagging: 'status=temporary' // Auto-tag as temporary
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION
  });
  
  // Construct CloudFront public URL
  const publicUrl = `${CLOUDFRONT_DOMAIN}/${s3Key}`;
    
  return res.json({success: true, data: {uploadUrl, publicUrl, expiresIn: PRESIGNED_URL_EXPIRATION}});
};


/* 
Though probably not needed, we can use wrappers down the line that
cater to some group flow. For example: 

function handleOtherService(fn){
  return (...args) => {
    process();
    return handleError(fn)(...args);
  }
}
*/
getServerHTML = handleError(getServerHTML);

getUser = handleError(getUser);
getUsers = handleError(getUsers);
createUser = handleError(createUser);
deleteUser = handleError(deleteUser);

getProduct = handleError(getProduct);
updateProduct = handleError(updateProduct);
deleteProduct = handleError(deleteProduct);
getActiveProducts = handleError(getActiveProducts);
createProduct = handleError(createProduct);
getProducts = handleError(getProducts);

getProductReviews = handleError(getProductReviews);
getUserReviews = handleError(getUserReviews);
updateReview = handleError(updateReview);
getReviews = handleError(getReviews);
createReview = handleError(createReview);
deleteReview = handleError(deleteReview);

cancelOrder = handleError(cancelOrder)
completeOrder = handleError(completeOrder);
getOrder = handleError(getOrder);
createOrder = handleError(createOrder);
deleteOrder = handleError(deleteOrder);

getUploadURL = handleError(getUploadURL);



module.exports = {
  getServerHTML,
  validateLogin, changePassword, getUser, getUsers, createUser, deleteUser,
  getProduct, updateProduct, deleteProduct, getActiveProducts, createProduct, getProducts,
  getProductReviews, getUserReviews, updateReview, getReviews, createReview, deleteReview,
  cancelOrder, completeOrder, getOrder, createOrder, deleteOrder,
  getUploadURL
};