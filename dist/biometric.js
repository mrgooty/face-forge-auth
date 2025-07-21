"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBiometric = verifyBiometric;
async function verifyBiometric(biometricAdapter, userId, biometricData) {
    // Placeholder: fetch profile and compare
    const profile = await biometricAdapter.getProfileByUserId(userId);
    if (!profile)
        return false;
    // TODO: Implement real biometric comparison logic
    return true;
}
