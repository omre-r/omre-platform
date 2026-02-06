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

app.get("/users/:id", controllers.getUser);
app.delete("/users/:id", controllers.deleteUser);

app.get("/users", controllers.getUsers);
app.post("/users", controllers.createUser);



// products
app.get("/products/active", controllers.getActiveProducts);

app.get("/products/:id", controllers.getProduct)
app.put("/products/:id", upload.array("images", 10), controllers.updateProduct)
app.delete("/products/:id", controllers.deleteProduct)

app.post("/products", upload.array("images", 10), controllers.createProduct);
app.get("/products", controllers.getProducts);


// reviews
app.get("/reviews/product/:productid", controllers.getProductReviews)
app.get("/reviews/user/:customerid", controllers.getUserReviews)

app.put("/reviews/:id", controllers.updateReview)
app.delete("/reviews/:id", controllers.deleteReview)


app.post("/reviews", upload.array("images", 10), controllers.createReview)
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