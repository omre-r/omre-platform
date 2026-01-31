const express = require("express");
const cors = require("cors");
const controllers = require("./controllers.js"); 

const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT

const app = express();
app.use(cors());
app.use(express.json());


app.get("/", controllers.getServerHTML);

const placeholder = () => {}

// users
app.put("/users/login/:id", placeholder)
app.put("/users/password/:id", controllers.changePassword)

app.get("/users/:id", controllers.getUser)

app.get("/users", controllers.getUsers);
app.post("/users", controllers.createUser);


// products
app.get("/products/:id", controllers.getProduct)
app.put("/products/:id", controllers.createProduct)
app.delete("/products/:id", controllers.deleteProduct)

app.get("/products/active", controllers.getActiveProducts);

app.post("/products", controllers.createProduct);
app.get("/products", controllers.getProducts);


// reviews
app.get("/reviews/product/:productid", controllers.getProductReviews)
app.get("/reviews/user/:customerid", controllers.getUserReviews)

app.put("/reviews/:id", controllers.updateReview)

app.post("/reviews", controllers.createReview)
app.get("/reviews", controllers.getReviews)


// orders
app.put("/orders/cancel/:id", controllers.cancelOrder)
app.put("/orders/complete/:id", controllers.completeOrder)

app.get("/orders/:id", controllers.getOrder)

app.post("/orders", controllers.createOrder)



//starting server
app.listen(PORT || 3001, () => {
  console.log(`Server running on port ${PORT}`);
});