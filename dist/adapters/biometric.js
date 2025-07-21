"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryBiometricAdapter = void 0;
const profiles = [];
exports.InMemoryBiometricAdapter = {
    async getProfileByUserId(userId) {
        return profiles.find(p => p.userId === userId) || null;
    },
    async saveProfile(profile) {
        const idx = profiles.findIndex(p => p.userId === profile.userId);
        if (idx >= 0)
            profiles[idx] = profile;
        else
            profiles.push(profile);
    },
};
