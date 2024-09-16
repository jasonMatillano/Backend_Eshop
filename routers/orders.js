const {Order} = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

router.get(`/`, async (req, res) =>{
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});

    if(!orderList) {
        res.status(500).json({success: false})
    } 
    res.send(orderList);
})

router.get(`/:id`, async (req, res) =>{
    const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({ 
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} 
        });

    if(!order) {
        res.status(500).json({success: false})
    } 
    res.send(order);
})

router.post('/', async (req, res) => {
    // Extract order items from the request body and save them to the database.
    // For each order item, create a new OrderItem document and save it.
    // Collect all newly created OrderItem IDs.
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });

        // Save the new OrderItem document to the database.
        newOrderItem = await newOrderItem.save();

        // Return the ID of the newly created OrderItem.
        return newOrderItem._id;
    }));

    // Wait for all order items to be saved and retrieve their IDs.
    const orderItemsIdsResolved = await orderItemsIds;

    // Calculate the total price for each order item.
    // Fetch each OrderItem by ID and populate the associated product's price.
    // Compute the total price for each order item and collect them.
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        // Find the OrderItem by its ID and populate the product field to get the price.
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');

        // Calculate the total price for this order item.
        const totalPrice = orderItem.product.price * orderItem.quantity;

        // Return the total price.
        return totalPrice;
    }));

    // Sum up all total prices to get the final total price of the order.
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    // Create a new Order document with the collected data.
    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    });

    // Save the new Order document to the database.
    order = await order.save();

    // If the order could not be saved, send a 400 error response.
    if (!order) {
        return res.status(400).send('The order cannot be created!');
    }

    // Send the created order as the response.
    res.send(order);
});



router.put('/:id',async (req, res)=> {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true}
    )

    if(!order)
    return res.status(400).send('the order cannot be update!')

    res.send(order);
})


router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "order not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

router.get('/get/totalsales', async (req, res)=> {
    const totalSales= await Order.aggregate([
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}}
    ])

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales})
})

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Order.countDocuments((count) => count)

    if(!orderCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid}).populate({ 
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} 
        }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})



module.exports =router;