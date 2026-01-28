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

//starting server
app.listen(PORT || 3001, () => {
  console.log(`Server running on port ${PORT}`);
});