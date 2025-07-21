"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signJwt(payload, secret, expiresIn = '1h') {
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
}
function verifyJwt(token, secret) {
    return jsonwebtoken_1.default.verify(token, secret);
}
