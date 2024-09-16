const { expressjwt: expressJwt } = require('express-jwt');

/**
 * Middleware for handling JWT authentication.
 * @returns {Function} - Returns the JWT middleware for Express.
 */
function authJwt() {
    const secret = process.env.secret; // Secret key for signing JWT
    const api = process.env.API_URL; // Base API URL for route matching

    // Check if the secret is defined in environment variables
    if (!secret) {
        throw new Error('JWT secret is not defined in environment variables');
    }

    // Return the configured express-jwt middleware
    return expressJwt({
        secret, // JWT secret
        algorithms: ['HS256'], // Hashing algorithm
        isRevoked: null // Function to check if the token is revoked
    }).unless({
        path: [
            { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] }, // Public GET access to products
            { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] }, // Public GET access to categories
            `${api}/users/login`, // Exclude login route
            `${api}/users/register`, // Exclude register route
        ]
    });
}

/**
 * Determines whether a token should be revoked.
 * @param {Object} req - The request object.
 * @param {Object} payload - The JWT payload.
 * @param {Function} done - The callback function to indicate whether the token is revoked.
 */
function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        return done(null, true); // Token is revoked for non-admins
    }
    return done(null, false); // Token is valid for admins
}

module.exports = authJwt;
