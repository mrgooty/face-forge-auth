"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuth = initAuth;
const middleware_1 = require("./middleware");
const jwt_1 = require("./jwt");
const biometric_1 = require("./biometric");
function initAuth(config) {
    return {
        jwtMiddleware: (0, middleware_1.jwtMiddleware)(config),
        signJwt: (payload) => (0, jwt_1.signJwt)(payload, config.jwtSecret, config.jwtExpiresIn),
        verifyJwt: (token) => (0, jwt_1.verifyJwt)(token, config.jwtSecret),
        verifyBiometric: (userId, data) => (0, biometric_1.verifyBiometric)(config.biometricAdapter, userId, data),
        config,
    };
}
