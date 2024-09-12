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


const Product = require("./models/product");
app.get(`${api}/products`,async function(req, res) {
    const productList = await Product.find({});

    if(!productList) {
        res.status(500).json({
            succes: false
        })
    }
    res.send(productList);
})

app.post(`${api}/products`, function(req, res) {
    const product = new Product({
        name: req.body.name,
        image: req.body.image,
        countInStock: req.body.countInStock
    })
    product.save().then((cratedProduct) => {
        res.status(201).json(cratedProduct);
    }).catch((err) => {
        res.status(500).json({
            error: err,
            succes: false
        });
    })
})

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
