const express = require("express");
const cors = require("cors");
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const controllers = require("./controllers.js"); 

const dotenv = require("dotenv");
dotenv.config();

const COGNITO_POOL_ID = process.env.COGNITO_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const PORT = process.env.PORT
const USE_ACCESS_TOKENS = true

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
  console.log("The token is", token);

  if (!token || token.split(".").length !== 3){
    return res.status(401).json({success: false, message: "Bad access token"});
  }

  try {
    const payload = await verifier.verify(token);
    console.log("The payload is", payload);
    return res.status(401).json({success: false, message: "Bad access token"});

    req.tokenPayload = payload;
  } catch (err) {
    console.error('Error verifying JWT:', err);
    return res.status(401).json({success: false, message: "Bad access token"});
  }
  return next()
}


app.get("/", controllers.getServerHTML);

// users
app.get("/users/:id", controllers.getUser);
app.delete("/users/:id", controllers.deleteUser);

app.get("/users", controllers.getUsers);
app.post("/users", controllers.createUser);



// products
app.get("/products/active", controllers.getActiveProducts);

app.get("/products/:id", controllers.getProduct)
app.put("/products/:id", controllers.updateProduct)
app.delete("/products/:id", controllers.deleteProduct)

app.post("/products", controllers.createProduct);
app.get("/products", controllers.getProducts);


// reviews
app.get("/reviews/product/:productid", controllers.getProductReviews)
app.get("/reviews/user/:customerid", controllers.getUserReviews)

app.put("/reviews/:id", controllers.updateReview)
app.delete("/reviews/:id", controllers.deleteReview)


app.post("/reviews", controllers.createReview)
app.get("/reviews", controllers.getReviews)


// orders
app.put("/orders/cancel/:id", controllers.cancelOrder)
app.put("/orders/complete/:id", controllers.completeOrder)

app.get("/orders/:id", controllers.getOrder)
app.delete("/orders/:id", controllers.deleteOrder)

app.post("/orders", controllers.createOrder)


// miscellaneous
app.get("/uploadurl", controllers.getUploadURL)

//starting server
app.listen(PORT || 5001, () => {
  console.log(`Server running on port ${PORT}`);
});