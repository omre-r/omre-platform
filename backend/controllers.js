
const {Users, Products, Reviews, Orders} = require("./config/db.js")

const users = Users.getUsersInstance()
const products = Products.getProductsInstance()
const reviews = Reviews.getReviewsInstance()
const orders = Orders.getOrdersInstance()

const randomUrls = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX4EbLlkmCJhmk4LI_PxiTc7OrHEkFE_wjeA&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvJZONCNGXEDHPopTA9pSMayySwNu9c8qfdA&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsgLo9vC_jTky9f4O_iksW-Uq2Yz5OP9aaog&s"
]

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


// users
// app.put("/users/login/:id", placeholder)

// path: GET /
function getServerHTML(req, res){
    res.send("Welcome to the server!");
};


// path: PUT /users/login/:id
async function validateLogin(req, res) {
  const options = {email, password};
  const result = await users.validateLogin(options);
  if (!result){
    return res.status(500).json({success: false,  message: "Failed to validate login"});
  }    
  return res.json(result);
}

// path: PUT /users/password/:id
async function changePassword(req, res){
  const {id} = req.params;
  const {password} = req.body;

  const options = {id, password};
  const result = await users.changePassword(options);
  if (!result){
    return res.status(500).json({success: false,  message: "Failed to change password"});
  }    
  return res.json(result);
}

// path: GET /users/:id
async function getUser(req, res){
  const {id} = req.params;
  const result = await users.getUser(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get user"});
  }
  return res.json(res);
}

// path: GET /users
async function getUsers(req, res){
  const result = await users.getUsers();
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get users"});
  }
  return res.json(res);
}

// path: POST /users
async function createUser(req, res){
  const result = await users.createUser(req.body);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to create user"});
  }
  return res.json(res);
}



//products

// path: GET /products/:id
async function getProduct(req, res) {
  const {id} = req.params;
  const result = await products.getProduct(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to get product"});
  }
  result.json(result)
}

// path: PUT /products/:id
async function updateProduct(req, res) {
  const {id} = req.params;
  const normalFields = JSON.parse(req.body.normalFields)
  const images = req.files.map(() => randomUrls[Math.floor(Math.random()*3)]);

  const result = await products.updateProduct(id, {...normalFields, images});
  if (!result){
    return res.status(500).json({success: false, message: "Failed to update product"});
  }
  result.json(result)
}

// path: DELETE /products/:id
async function deleteProduct(req, res) {
  const {id} = req.params;
  const result = await products.deleteProduct(id);
  if (!result){
    return res.status(500).json({success: false, message: "Failed to delete product"});
  }
  result.json(result)
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
  //TODO: make images S3 urls
  const normalFields = JSON.parse(req.body.normalFields)
  const images = req.files.map(() => randomUrls[Math.floor(Math.random()*3)]);

  const result = await products.createProduct({...normalFields, images});
  if (!result){
    return res.status(500).json({success: false, message: "Failed to create product"});
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
  res.json(result);
}

// path: GET /reviews/user/:customerid
async function getUserReviews(req, res) {
  const {customerid} = req.params;
  const result = await reviews.getUserReviews(customerid);
  if (!result){
    res.status(500).json({success: false, message: "Failed to get user's reviews"});
  }
  res.json(result);
}

// path: PUT /reviews/:id
async function updateReview(req, res) {
  const {productid} = req.params;
  const result = await reviews.updateReview(productid, req.body);
  if (!result){
    res.status(500).json({success: false, message: "Failed to update product review"});
  }
  res.json(result);
}

// path: GET /reviews
async function getReviews(req, res) {
  const result = await reviews.getReviews();
  if (!result){
    res.status(500).json({success: false, message: "Failed to get reviews"});
  }
  res.json(result);
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
  res.json(result);
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

validateLogin = handleError(validateLogin);
changePassword = handleError(changePassword);
getUser = handleError(getUser);
getUsers = handleError(getUsers);
createUser = handleError(createUser);

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

cancelOrder = handleError(createOrder)
completeOrder = handleError(completeOrder);
getOrder = handleError(getOrder);
createOrder = handleError(getReviews);



module.exports = {
  getServerHTML,
  validateLogin, changePassword, getUser, getUsers, createUser,
  getProduct, updateProduct, deleteProduct, getActiveProducts, createProduct, getProducts,
  getProductReviews, getUserReviews, updateReview, getReviews, createReview,
  cancelOrder, completeOrder, getOrder, createOrder
};