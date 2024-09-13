const { expressjwt: expressJwt } = require('express-jwt');

function authJwt() {
    const secret = process.env.secret;
    if (!secret) {
        throw new Error('JWT secret is not defined in environment variables');
    }

    return expressJwt({
        secret,
        algorithms: ['HS256'],
    }).unless({
        path: [
            { url: /\/api\/v1\/users\/auth\/register/, methods: ['POST'] },
            { url: /\/api\/v1\/users\/auth\/login/, methods: ['POST'] }
        ]
    });
}

module.exports = authJwt;
