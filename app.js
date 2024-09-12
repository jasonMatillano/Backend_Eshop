const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");

require('dotenv/config');
const api = process.env.API_URL;

// middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));

// routers
app.use(`${api}/products`, require('./routers/products'));

mongoose.connect(process.env.MONGODB_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "eshopDB"
})
.then(() => console.log("database connection successful, connection ready..."))
.catch((err) => console.log(err));

app.listen(3000, () => {
    console.log(api);
    console.log("server is running on http://localhost:3000");
})
