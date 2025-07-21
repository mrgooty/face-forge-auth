"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtMiddleware = jwtMiddleware;
const jwt_1 = require("./jwt");
function jwtMiddleware(config) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader)
            return res.status(401).json({ message: 'Missing Authorization header' });
        const token = authHeader.split(' ')[1];
        if (!token)
            return res.status(401).json({ message: 'Missing token' });
        try {
            const user = (0, jwt_1.verifyJwt)(token, config.jwtSecret);
            req.user = user;
            next();
        }
        catch (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
    };
}
