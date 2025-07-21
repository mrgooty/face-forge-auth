"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserAdapter = void 0;
const users = [
    { id: '1', email: 'test@example.com', passwordHash: 'test', role: 'user' },
];
exports.InMemoryUserAdapter = {
    async getUserById(id) {
        return users.find(u => u.id === id) || null;
    },
    async getUserByEmail(email) {
        return users.find(u => u.email === email) || null;
    },
    async validatePassword(user, password) {
        // In production, use bcrypt! This is for demo only.
        return user.passwordHash === password;
    },
};
