const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require("uuid");
const { Users, Products, Reviews, Orders, Blends, CartItems, Recommendations } = require("./config/db.js")

const dotenv = require("dotenv");
dotenv.config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const USE_ACCESS_TOKENS = process.env.USE_ACCESS_TOKENS === "true";

// working with images 
const s3Client = new S3Client({ 
  region: 'us-east-1',
  credentials: {
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    accessKeyId: S3_ACCESS_KEY_ID
  }
});

// access db resources
const users = new Users()
const products = new Products()
const reviews = new Reviews()
const orders = new Orders()
const blends = new Blends()
const cartItems = new CartItems()
const recommendations = new Recommendations()

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
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: GET /users
async function getUsers(req, res){
  const result = await users.getUsers();
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: POST /users
async function createUser(req, res){
  const result = await users.createUser(req.body);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: DELETE /users/:id
async function deleteUser(req, res) {
  const {id} = req.params;
  const result = await users.deleteUser(id);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: PUT /users/:id/last-login
async function updateLastLogin(req, res) {
  const {id} = req.params;
  const result = await users.updateLastLogin(id);

  if (!result.success) {
    return res.status(result.status).json(result);
  }

  return res.json(result);
}


// path: GET /users/filter
async function getFilteredUsers(req, res) {
  if (!req.query?.filters){
    throw new Error("No filters query param")
  }
  const filters = JSON.parse(req.query.filters)
  const result = await users.getFilteredUsers(filters);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}




//products

// path: GET /products/:id
async function getProduct(req, res) {
  const {id} = req.params;
  const result = await products.getProduct(id);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: GET /products/related/:parentid
async function getRelatedProducts(req, res) {
  const {parentid} = req.params;
  const result = await products.getRelatedProducts(parentid);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: PUT /products/:id
async function updateProduct(req, res) {
  const {id} = req.params;
  const result = await products.updateProduct(id, req.body);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: PUT /products/stock/:parentid
async function updateProductStock(req, res) {
  const {parentid} = req.params;
  const {stock_ml} = req.body;
  const result = await products.updateProductStock(parentid, stock_ml);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: DELETE /products/:id
async function deleteProduct(req, res) {
  const {id} = req.params;
  const result = await products.deleteProduct(id);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: GET /products/active
async function getActiveProducts(req, res) {
  const result = await products.getActiveProducts();
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: GET /products/filter
async function getFilteredProducts(req, res) {
  if (!req.query?.filters){
    throw new Error("No filters query param")
  }
  const filters = JSON.parse(req.query.filters)
  const result = await products.getFilteredProducts(filters);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: POST /products
async function createProduct(req, res) {
  const result = await products.createProduct(req.body);

  // this function includes logic from Ayman's lambda function that he made following his own pattern.
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: GET /products
async function getProducts(req, res) {
  const result = await products.getProducts();
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}



// reviews

// path: GET /reviews/product/:productid
async function getProductReviews(req, res) {
  const {productid} = req.params;
  const result = await reviews.getProductReviews(productid);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: GET /reviews/user/:customerid
async function getUserReviews(req, res) {
  const {customerid} = req.params;
  const result = await reviews.getUserReviews(customerid);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: PUT /reviews/:id
async function updateReview(req, res) {
  const {id} = req.params;
  const result = await reviews.updateReview(id, req.body);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: GET /reviews
async function getReviews(req, res) {
  const result = await reviews.getReviews();
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: POST /reviews
async function createReview(req, res) {
  const result = await reviews.createReview(req.body);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: DELETE /reviews/:id
async function deleteReview(req, res) {
  const {id} = req.params;
  const result = await reviews.deleteReview(id);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}


// orders

//path: PUT /orders/cancel/:id
async function cancelOrder(req, res) {
  const {id} = req.params;
  const {cancelreason} = req.body;
  const result = await orders.cancelOrder(id, cancelreason);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: PUT /orders/:id
async function updateOrderStatus(req, res) {
  const {id} = req.params;
  const {status} = req.body;
  const result = await orders.updateOrderStatus(id, status);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: GET /orders/:id
async function getOrder(req, res) {
  const {id} = req.params;
  const result = await orders.getOrder(id);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: GET /orders/user/:customerid
async function getUserOrders(req, res) {
  const {customerid} = req.params;
  const result = await orders.getUserOrders(customerid);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: POST /orders
async function createOrder(req, res) {
  const {customerid} = req.body
  const result = await orders.createOrder(customerid);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: DELETE /orders/:id
async function deleteOrder(req, res) {
  const {id} = req.params;
  const result = await orders.deleteOrder(id);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}

// path: GET /orders
async function getOrders(req, res) {
  const result = await orders.getOrders();

  if (!result.success) {
    return res.status(result.status).json(result);
  }

  return res.json(result);
}

// path: GET /orders/filter
async function getFilteredOrders(req, res) {
  if (!req.query?.filters){
    throw new Error("No filters query param")
  }
  const filters = JSON.parse(req.query.filters)
  const result = await orders.getFilteredOrders(filters);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result)
}


// blends

// path: POST /blends/save
async function saveBlend(req, res) {
    if (USE_ACCESS_TOKENS){
      const {userid} = req.body
      if (userid !== req.tokenPayload.sub){
        return res.status(401).json({ success: false, message: "Not authenticated" })
      }
    }
    const result = await blends.saveBlend(req.body);
    if (!result.success) return res.status(result.status || 400).json(result);
    return res.json(result);
}



// path: GET /blends
async function getUserBlends(req, res) {
    const {userid} = req.params
    if (USE_ACCESS_TOKENS){
      if (userid !== req.tokenPayload.sub){
        return res.status(401).json({ success: false, message: "Not authenticated" })
      }
    }
    const result = await blends.getUserBlends(userid);
    if (!result.success) return res.status(result.status || 400).json(result);
    return res.json(result);
}


// path: GET /blends/item/:id
async function getBlendById(req, res) {
    const { id } = req.params; // blend id

    // Call the DB method
    const result = await blends.getBlendById(id);

    if (!result.success) {
        return res.status(result.status || 404).json(result);
    }

    return res.json(result);
}

// path: DELETE /blends/:blendid
// Gets logged in user, pulls blend id from params, calls db function with userid and blendid 
async function deleteUserBlend(req, res) {
    const {userid} = req.body;
    if (USE_ACCESS_TOKENS){
      if (userid !== req.tokenPayload.sub){
        return res.status(401).json({ success: false, message: "Not authenticated" })
      }
    }

    const {blendid} = req.params;
    if (!blendid) return res.status(400).json({ success: false, message: "Missing blend id" });

    const result = await blends.deleteUserBlend(userid, blendid);

    if (!result.success) return res.status(result.status || 400).json(result);
    return res.json(result);
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

// cart items
// path: POST /cartitems
async function createCartItem(req, res) {
  const result = await cartItems.createCartItem(req.body);
  // stockUnavailable is a valid business response, not a server error — always 200
  if (!result.success && !result.stockUnavailable) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}

// path: DELETE /cartitems/:id
async function deleteCartItem(req, res) {
  const {id} = req.params
  const result = await cartItems.deleteCartItem(id);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: GET /cartitems/:customerid
async function getCart(req, res) {
  const {customerid} = req.params;
  const result = await cartItems.getCart(customerid);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: DELETE /cartitems/clear/:customerid
async function clearCart(req, res) {
  const {customerid} = req.params;
  const result = await cartItems.clearCart(customerid);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: PUT /cartitems/:customerid
async function updateCart(req, res) {
  const {customerid} = req.params;
  const {items} = req.body
  const result = await cartItems.updateCart(customerid, items);
  if (!result.success){
    return res.status(result.status).json(result);
  }
  return res.json(result);
}

// path: GET /recommendations/:userid
async function getRecommendations(req, res) {
    const {userid} = req.params;
    if (USE_ACCESS_TOKENS){
      if (userid !== req.tokenPayload.sub){
        return res.status(401).json({ success: false, message: "Not authenticated" })
      }
    }
    if (!userid) {
        return res.status(401).json({ success: false, message: "Missing user identifier" });
    }
    const result = await recommendations.getRecommendations(userid);
    if (!result.success) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
}

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
updateLastLogin = handleError(updateLastLogin);
getFilteredUsers= handleError(getFilteredUsers);


getProduct = handleError(getProduct);
getRelatedProducts = handleError(getRelatedProducts);
updateProduct = handleError(updateProduct);
updateProductStock = handleError(updateProductStock);
deleteProduct = handleError(deleteProduct);
getActiveProducts = handleError(getActiveProducts);
createProduct = handleError(createProduct);
getProducts = handleError(getProducts);
getFilteredProducts = handleError(getFilteredProducts);

getProductReviews = handleError(getProductReviews);
getUserReviews = handleError(getUserReviews);
updateReview = handleError(updateReview);
getReviews = handleError(getReviews);
createReview = handleError(createReview);
deleteReview = handleError(deleteReview);

cancelOrder = handleError(cancelOrder)
getOrder = handleError(getOrder);
createOrder = handleError(createOrder);
deleteOrder = handleError(deleteOrder);
updateOrderStatus = handleError(updateOrderStatus);
getUserOrders = handleError(getUserOrders);
getFilteredOrders = handleError(getFilteredOrders);
getOrders = handleError(getOrders);

saveBlend = handleError(saveBlend);
getUserBlends = handleError(getUserBlends);
getRecommendations = handleError(getRecommendations); 

createCartItem = handleError(createCartItem);
deleteCartItem = handleError(deleteCartItem);
getCart = handleError(getCart);
clearCart = handleError(clearCart);
updateCart = handleError(updateCart);
deleteUserBlend = handleError(deleteUserBlend);

getUploadURL = handleError(getUploadURL);



module.exports = {
  getServerHTML,
  getUser, getUsers, createUser, deleteUser, updateLastLogin, getFilteredUsers,
  getProduct, getRelatedProducts, updateProduct, updateProductStock, deleteProduct, getActiveProducts, createProduct, getProducts, getFilteredProducts, 
  getProductReviews, getUserReviews, updateReview, getReviews, createReview, deleteReview,
  cancelOrder, getOrder, createOrder, deleteOrder, updateOrderStatus,getUserOrders, getOrders, getFilteredOrders,
  saveBlend, getUserBlends, deleteUserBlend, getBlendById,
  createCartItem, deleteCartItem, getCart, clearCart, updateCart,
  getUploadURL,
  getRecommendations,
};
