const express = require("express");
const cors = require("cors");
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const controllers = require("./controllers.js"); 

const dotenv = require("dotenv");
dotenv.config();

const COGNITO_POOL_ID = process.env.COGNITO_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const PORT = process.env.PORT;
const USE_ACCESS_TOKENS = process.env.USE_ACCESS_TOKENS === "true";

const verifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_POOL_ID,
  tokenUse: 'access',
  clientId: COGNITO_CLIENT_ID
});


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

async function verifyToken(req, res, next){
  if (!USE_ACCESS_TOKENS) return next();
  const token = req.headers?.authorization?.split(" ")?.[1];

  if (!token || token.split(".").length !== 3){
    return res.status(401).json({success: false, message: "Bad access token"});
  }

  try {
    const payload = await verifier.verify(token);
    req.tokenPayload = payload;
  } catch (err) {
    // console.log("Error verifying JWT",err);
    return res.status(401).json({success: false, message: "Bad access token"});
  }
  return next()
}

async function checkAdminPerm(req, res, next) {
  if (!USE_ACCESS_TOKENS) return next();

  if (!req?.tokenPayload || !req?.tokenPayload?.["cognito:groups"]?.includes("admin")){
    return res.status(401).json({success: false, message: "You do not have permission to access this"})
  }
  return next()
}

app.get("/", controllers.getServerHTML);

// users

// path: PUT /users/last-login
app.put("/users/:id/last-login", [verifyToken], controllers.updateLastLogin);

app.get("/users/filter", [verifyToken, checkAdminPerm],controllers.getFilteredUsers);
app.get("/users/:id", [verifyToken], controllers.getUser);
app.delete("/users/:id", [verifyToken, checkAdminPerm], controllers.deleteUser);

app.get("/users", [verifyToken, checkAdminPerm], controllers.getUsers);
app.post("/users", [verifyToken], controllers.createUser);





// products
app.get("/products/related/:parentid", controllers.getRelatedProducts);
app.put("/products/stock/:parentid", controllers.updateProductStock);

app.get("/products/active", controllers.getActiveProducts);
app.get("/products/filter", controllers.getFilteredProducts);

app.get("/products/:id", controllers.getProduct)
app.put("/products/:id", [verifyToken, checkAdminPerm], controllers.updateProduct)
app.delete("/products/:id", [verifyToken, checkAdminPerm], controllers.deleteProduct)

app.post("/products", [verifyToken, checkAdminPerm], controllers.createProduct);
app.get("/products", controllers.getProducts);


// reviews
app.get("/reviews/product/:productid", controllers.getProductReviews)
app.get("/reviews/user/:customerid", controllers.getUserReviews)

app.put("/reviews/:id", [verifyToken], controllers.updateReview)
app.delete("/reviews/:id", [verifyToken], controllers.deleteReview)


app.post("/reviews", [verifyToken], controllers.createReview)
app.get("/reviews", controllers.getReviews)


// orders
app.put("/orders/cancel/:id", [verifyToken], controllers.cancelOrder)
app.get("/orders/user/:customerid", [verifyToken], controllers.getUserOrders)

app.get("/orders/filter", [verifyToken, checkAdminPerm],controllers.getFilteredOrders);
app.get("/orders/:id", [verifyToken], controllers.getOrder)
app.delete("/orders/:id", [verifyToken, checkAdminPerm], controllers.deleteOrder)
app.put("/orders/:id", [verifyToken, checkAdminPerm], controllers.updateOrderStatus);

app.post("/orders", [verifyToken], controllers.createOrder)
app.get("/orders", [verifyToken], controllers.getOrders);

// blends
app.post("/blends/save", [verifyToken], controllers.saveBlend);
app.get("/blends/:userid", [verifyToken], controllers.getUserBlends);
app.delete("/blends/:blendid", [verifyToken], controllers.deleteUserBlend);
app.get("/blends/item/:id", [verifyToken], controllers.getBlendById);

// cart items
app.delete("/cartitems/clear/:customerid", [verifyToken], controllers.clearCart)

app.get("/cartitems/:customerid", [verifyToken], controllers.getCart);
app.put("/cartitems/:customerid", [verifyToken], controllers.updateCart)
app.delete("/cartitems/:id", [verifyToken], controllers.deleteCartItem);

app.post("/cartitems", [verifyToken], controllers.createCartItem);



// miscellaneous
app.get("/uploadurl", [verifyToken], controllers.getUploadURL)
app.get("/recommendations/:userid", [verifyToken], controllers.getRecommendations)

//starting server
app.listen(PORT || 5001, () => {
  console.log(`Server running on port ${PORT}`);
});