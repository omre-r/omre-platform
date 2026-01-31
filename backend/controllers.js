
const {Users, Products, Reviews, Orders} = require("./config/db.js")

const users = Users.getUsersInstance()
const products = Products.getProductsInstance()
const reviews = Reviews.getReviewsInstance()
const orders = Orders.getOrdersInstance()

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


// // users
// app.put("/users/login/:id", placeholder)

// // orders
// app.put("/orders/cancel/:id", placeholder)
// app.put("/orders/complete/:id", placeholder)

// app.post("/orders", placeholder)
// app.get("/orders", placeholder)


// path: GET /
function getServerHTML(req, res){
    res.send("Welcome to the server!");
};


// users

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
  const result = await products.updateProduct(id, req.body);
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
  const result = await products.createProduct(req.body);
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
  const result = await reviews.updateProduct(productid, req.body);
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
  const result = await reviews.createReview(req.body);
  if (!result){
    res.status(500).json({success: false, message: "Failed to create review"});
  }
  res.json(result);
}




getServerHTML = handleError(getServerHTML);

changePassword = handleError(changePassword);
getUser = handleError(getUser);
getUsers = handleError(getUsers);
createUser = handleError(createUser);


module.exports = {getServerHTML};