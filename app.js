const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const authJwt = require('./helpers/jwt');   
require('dotenv/config');

// middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());

const api = process.env.API_URL;
// routers
app.use(`${api}/products`, require('./routers/products'));
app.use(`${api}/categories`, require('./routers/categories'));
app.use(`${api}/users`, require('./routers/users'));


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
