"use strict";
// AES-GCM encryption utilities for browser (Web Crypto API)
// Usage: encryptData(faceData, key) -> { iv, ciphertext }
//        decryptData({ iv, ciphertext }, key) -> faceData
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKey = generateKey;
exports.encryptData = encryptData;
exports.decryptData = decryptData;
async function generateKey() {
    return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
async function encryptData(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    return { iv, ciphertext };
}
async function decryptData(encrypted, key) {
    const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encrypted.iv }, key, encrypted.ciphertext);
    const json = new TextDecoder().decode(decoded);
    return JSON.parse(json);
}
