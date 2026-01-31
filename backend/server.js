const express = require("express");
const cors = require("cors");
const multer = require("multer");
const upload = multer({storage: multer.memoryStorage()});

const controllers = require("./controllers.js"); 

const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.get("/", controllers.getServerHTML);


// users
app.put("/users/login/:id", controllers.validateLogin)
app.put("/users/password/:id", controllers.changePassword)

app.get("/users/:id", controllers.getUser)

app.get("/users", controllers.getUsers);
app.post("/users", controllers.createUser);


// products
app.get("/products/:id", controllers.getProduct)
app.put("/products/:id", controllers.createProduct)
app.delete("/products/:id", controllers.deleteProduct)

app.get("/products/active", controllers.getActiveProducts);

app.post("/products", upload.array("images", 3), controllers.createProduct);
app.get("/products", controllers.getProducts);


// reviews
app.get("/reviews/product/:productid", controllers.getProductReviews)
app.get("/reviews/user/:customerid", controllers.getUserReviews)

app.put("/reviews/:id", controllers.updateReview)

app.post("/reviews", upload.array("images", 3), controllers.createReview)
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