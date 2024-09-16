const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Route to get a list of all users
router.get('/', async (req, res) => {
    try {
        // Retrieve all users from the database, excluding the passwordHash field
        const userList = await User.find().select('-passwordHash');

        // If no users are found, send a 500 status with a failure message
        if (!userList) {
            return res.status(500).json({ success: false, message: 'No users found.' });
        }

        // If users are found, send the list with a 200 status
        res.status(200).send(userList);
    } catch (error) {
        // Handle any errors that occur during the process
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Route to get a user by their ID
router.get('/:id', async (req, res) => {
    try {
        // Find the user by ID, excluding the passwordHash field from the result
        const user = await User.findById(req.params.id).select('-passwordHash');

        // If the user is not found, send a 500 status with an error message
        if (!user) {
            return res.status(500).json({ message: 'The user with the given ID was not found.' });
        }

        // If the user is found, send the user object with a 200 status
        res.status(200).send(user);
    } catch (error) {
        // Handle any errors that occur during the process
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});


router.post('/', async (req, res) => {
    try {
        // Destructure request body for easier access
        const { name, email, password, phone, isAdmin, street, apartment, zip, city, country } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send('Email already in use!');
        }

        // Create new user instance
        let user = new User({
            name,
            email,
            passwordHash: bcrypt.hashSync(password, 10),
            phone,
            isAdmin,
            street,
            apartment,
            zip,
            city,
            country,
        });

        // Save the user to the database
        user = await user.save();

        // Check if user was created successfully
        if (!user) {
            return res.status(400).send('The user cannot be created!');
        }

        // Send the created user as a response
        res.status(201).send(user);
    } catch (error) {
        // Handle any errors that occur during the process
        res.status(500).send('Server error: ' + error.message);
    }
});


router.put('/:id',async (req, res)=> {

    const userExist = await User.findById(req.params.id);
    let newPassword
    if(req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        },
        { new: true}
    )

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);
})

router.post('/login', async (req, res) => {
    try {
        // Find a user in the database with the given email address
        const user = await User.findOne({ email: req.body.email });

        // Secret key for signing the JWT token from environment variables
        const secret = process.env.secret;

        // If no user is found with the provided email, return a 400 status with an error message
        if (!user) {
            return res.status(400).send('The user not found');
        }

        // Check if the provided password matches the hashed password in the database
        if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
            // Generate a JWT token if the password matches
            const token = jwt.sign(
                {
                    userId: user.id,         // User ID
                    isAdmin: user.isAdmin    // User's admin status
                },
                secret,                      // Secret key for signing the token
                { expiresIn: '1d' }          // Token expiration time
            );

            // Respond with the user's email and the generated token
            res.status(200).send({ user: user.email, token: token });
        } else {
            // If the password is incorrect, return a 400 status with an error message
            res.status(400).send('Password is wrong!');
        }
    } catch (err) {
        // Handle any unexpected errors that occur during the operation
        res.status(500).send('An error occurred');
    }
})

router.post('/register', async (req, res) => {
    try {
        // Destructure request body for easier access
        const { name, email, password, phone, isAdmin, street, apartment, zip, city, country } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send('Email already in use!');
        }

        // Create new user instance
        let user = new User({
            name,
            email,
            passwordHash: bcrypt.hashSync(password, 10),
            phone,
            isAdmin,
            street,
            apartment,
            zip,
            city,
            country,
        });

        // Save the user to the database
        user = await user.save();

        // Check if user was created successfully
        if (!user) {
            return res.status(400).send('The user cannot be created!');
        }

        // Send the created user as a response
        res.status(201).send(user);
    } catch (error) {
        // Handle any errors that occur during the process
        res.status(500).send('Server error: ' + error.message);
    }
});


router.delete('/:id', async (req, res) => {
    try {
        // Attempt to find the user by ID and remove them from the collection
        const user = await User.findByIdAndDelete(req.params.id);

        // Check if a user was found and deleted
        if (user) {
            // Respond with a success message if the user was deleted
            return res.status(200).json({ success: true, message: 'The user is deleted!' });
        } else {
            // Respond with an error message if the user was not found
            return res.status(404).json({ success: false, message: 'User not found!' });
        }
    } catch (err) {
        // Handle any errors that occur during the database operation
        return res.status(500).json({ success: false, error: err.message });
    }
});


router.get(`/get/count`, async (req, res) => {
    try {
        // Fetch the count of all documents in the User collection
        const userCount = await User.countDocuments();

        // Check if the count is undefined or null
        if (userCount === undefined || userCount === null) {
            return res.status(500).json({ success: false, message: 'Could not count users.' });
        }

        // Send the user count as the response
        res.send({
            userCount: userCount
        });
    } catch (error) {
        // Handle any errors that occur during the database operation
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});



module.exports =router;
