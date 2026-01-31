const express = require("express");
const cors = require("cors");
const controllers = require("./controllers.js"); 
const db = require("./config/db.js")

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
app.put("/users/password/:id", placeholder)

app.get("/users/:id", placeholder)

app.get("/users", placeholder);
app.post("/users", placeholder);


// products
app.get("/products/:id", placeholder)
app.put("/products/:id", placeholder)
app.delete("/products/:id", placeholder)

app.get("/products/active", placeholder);

app.post("/products", placeholder);
app.get("/products", placeholder);


// reviews
app.get("/reviews/product/:productid", placeholder)
app.get("/reviews/user/:customerid", placeholder)

app.put("/reviews/:id", placeholder)

app.post("/reviews", placeholder)
app.get("/reviews", placeholder)


// orders
app.put("/orders/cancel/:id", placeholder)
app.put("/orders/complete/:id", placeholder)

app.post("/orders", placeholder)
app.get("/orders", placeholder)



//starting server
app.listen(PORT || 3001, () => {
  console.log(`Server running on port ${PORT}`);
});