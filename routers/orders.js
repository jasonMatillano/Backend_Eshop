const {Order} = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

// GET request to fetch a list of orders, sorted by date in descending order
router.get(`/`, async (req, res) => {

    // Fetch all orders from the database, populating the 'user' field with the user's name, and sorting by 'dateOrdered' in descending order
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});

    // If no orders are found or an error occurs, send a 500 response with success set to false
    if (!orderList) {
        res.status(500).json({ success: false });
    } 

    // If orders are found, send them as the response
    res.send(orderList);
});


// GET request to fetch details of a specific order by ID
router.get(`/:id`, async (req, res) => {

    // Fetch the order by ID from the database, populate 'user' with the user's name,
    // and populate 'orderItems' with the associated 'product' and its 'category'
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')  // Populate the 'user' field with the 'name' of the user
        .populate({ 
            path: 'orderItems',  // Populate 'orderItems' array
            populate: {
                path: 'product',  // For each order item, populate the 'product'
                populate: 'category'  // For each product, populate its 'category'
            } 
        });

    // If the order with the given ID is not found, send a 500 response with success set to false
    if (!order) {
        res.status(500).json({ success: false });
    } 

    // If the order is found, send it as the response
    res.send(order);
});


// Extract order items from the request body and save them to the database.
router.post('/', async (req, res) => {
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


// PUT request to update the status of a specific order by ID
router.put('/:id', async (req, res) => {

    // Find the order by ID and update its status field with the value from the request body
    const order = await Order.findByIdAndUpdate(
        req.params.id,  // The ID of the order to update (from request parameters)
        {
            status: req.body.status  // The new status of the order (from request body)
        },
        { new: true }  // Return the updated order instead of the old one
    );

    // If the order is not found or cannot be updated, return a 400 response with an error message
    if (!order)
        return res.status(400).send('The order cannot be updated!');

    // If the update is successful, send the updated order as the response
    res.send(order);
});



// DELETE request to remove an order by its ID
router.delete('/:id', (req, res) => {
    
    // Find the order by its ID and delete it
    Order.findByIdAndDelete(req.params.id).then(async order => {
        
        // If the order is found and deleted successfully
        if(order) {

            // Loop through the orderItems in the deleted order and delete each associated OrderItem
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndDelete(orderItem);  // Delete each orderItem
            });

            // Return a success message indicating the order was deleted
            return res.status(200).json({
                success: true, 
                message: 'The order is deleted!'
            });
        } else {
            // If the order is not found, return a 404 error message
            return res.status(404).json({
                success: false, 
                message: "Order not found!"
            });
        }

    }).catch(err => {
        // If there's an error during the delete process, return a 500 error
        return res.status(500).json({
            success: false, 
            error: err
        });
    });
});

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