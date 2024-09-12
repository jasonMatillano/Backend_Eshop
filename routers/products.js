const Product = require("../models/product");
const express = require('express');
const router = express.Router();

router.get(`/`,async function(req, res) {
    const productList = await Product.find({});

    if(!productList) {
        res.status(500).json({
            succes: false
        })
    }
    res.send(productList);
})

router.post(`/`, function(req, res) {
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

module.exports = router;