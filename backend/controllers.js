
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


// // reviews
// app.get("/reviews/product/:productid", placeholder)
// app.get("/reviews/user/:customerid", placeholder)

// app.put("/reviews/:id", placeholder)

// app.post("/reviews", placeholder)
// app.get("/reviews", placeholder)


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





getServerHTML = handleError(getServerHTML);

changePassword = handleError(changePassword);
getUser = handleError(getUser);
getUsers = handleError(getUsers);
createUser = handleError(createUser);


module.exports = {getServerHTML};