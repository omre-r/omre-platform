
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
// app.put("/users/password/:id", placeholder)

// app.get("/users/:id", placeholder)

// app.get("/users", placeholder);
// app.post("/users", placeholder);


// // products
// app.get("/products/:id", placeholder)
// app.put("/products/:id", placeholder)
// app.delete("/products/:id", placeholder)

// app.get("/products/active", placeholder);

// app.post("/products", placeholder);
// app.get("/products", placeholder);


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








getServerHTML = handleError(getServerHTML);

changePassword = handleError(changePassword);
getUser = handleError(getUser);
getUsers = handleError(getUsers);
createUser = handleError(createUser);


module.exports = {getServerHTML};