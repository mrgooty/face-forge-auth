"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.livenessDetectionService = exports.LivenessDetectionService = void 0;
class LivenessDetectionService {
    constructor() {
        this.blinkThreshold = 0.25;
    }
    validateChallenge(challengeType, livenessData, challengeStartTime) {
        const duration = Date.now() - challengeStartTime;
        const startTime = challengeStartTime;
        switch (challengeType) {
            case 'blink':
                return this.validateBlinkChallenge(livenessData, duration, startTime);
            case 'head_left':
                return this.validateHeadMovement(livenessData, 'left', duration, startTime);
            case 'head_right':
                return this.validateHeadMovement(livenessData, 'right', duration, startTime);
            case 'head_up':
                return this.validateHeadMovement(livenessData, 'up', duration, startTime);
            case 'head_down':
                return this.validateHeadMovement(livenessData, 'down', duration, startTime);
            case 'smile':
                return this.validateSmileChallenge(livenessData, duration, startTime);
            case 'open_mouth':
                return this.validateMouthOpenChallenge(livenessData, duration, startTime);
            default:
                return {
                    challengeType,
                    requested: true,
                    completed: false,
                    success: false,
                    confidence: 0,
                    duration,
                    timestamp: startTime
                };
        }
    }
    validateBlinkChallenge(livenessData, duration, startTime) {
        let blinkCount = 0;
        let wasBlinking = false;
        for (const data of livenessData) {
            const isBlinking = data.eyeAspectRatio < this.blinkThreshold;
            if (!isBlinking && wasBlinking) {
                blinkCount++;
            }
            wasBlinking = isBlinking;
        }
        const success = blinkCount >= 1;
        const confidence = Math.min(blinkCount / 2, 1);
        return {
            challengeType: 'blink',
            requested: true,
            completed: true,
            success,
            confidence,
            duration,
            timestamp: startTime
        };
    }
    validateHeadMovement(livenessData, direction, duration, startTime) {
        if (livenessData.length < 2) {
            return {
                challengeType: `head_${direction}`,
                requested: true,
                completed: false,
                success: false,
                confidence: 0,
                duration,
                timestamp: startTime
            };
        }
        const firstPose = livenessData[0].headMovement;
        const movements = livenessData.map(d => d.headMovement);
        let maxMovement = 0;
        let success = false;
        switch (direction) {
            case 'left':
                maxMovement = Math.max(...movements.map(m => firstPose.yaw - m.yaw));
                success = maxMovement > 15;
                break;
            case 'right':
                maxMovement = Math.max(...movements.map(m => m.yaw - firstPose.yaw));
                success = maxMovement > 15;
                break;
            case 'up':
                maxMovement = Math.max(...movements.map(m => m.pitch - firstPose.pitch));
                success = maxMovement > 10;
                break;
            case 'down':
                maxMovement = Math.max(...movements.map(m => firstPose.pitch - m.pitch));
                success = maxMovement > 10;
                break;
        }
        const confidence = Math.min(maxMovement / 20, 1);
        return {
            challengeType: `head_${direction}`,
            requested: true,
            completed: true,
            success,
            confidence,
            duration,
            timestamp: startTime
        };
    }
    validateSmileChallenge(livenessData, duration, startTime) {
        const baselineMouthAR = livenessData.slice(0, 5).reduce((sum, d) => sum + d.mouthAspectRatio, 0) / 5;
        const maxMouthAR = Math.max(...livenessData.map(d => d.mouthAspectRatio));
        const smileIncrease = maxMouthAR - baselineMouthAR;
        const success = smileIncrease > 0.1;
        const confidence = Math.min(smileIncrease / 0.3, 1);
        return {
            challengeType: 'smile',
            requested: true,
            completed: true,
            success,
            confidence,
            duration,
            timestamp: startTime
        };
    }
    validateMouthOpenChallenge(livenessData, duration, startTime) {
        const maxMouthAR = Math.max(...livenessData.map(d => d.mouthAspectRatio));
        const success = maxMouthAR > 0.4;
        const confidence = Math.min(maxMouthAR / 0.6, 1);
        return {
            challengeType: 'open_mouth',
            requested: true,
            completed: true,
            success,
            confidence,
            duration,
            timestamp: startTime
        };
    }
    calculateOverallLivenessScore(livenessData) {
        if (livenessData.length === 0)
            return 0;
        let score = 0;
        let factors = 0;
        // Blink detection factor
        const blinkVariation = this.calculateVariation(livenessData.map(d => d.eyeAspectRatio));
        if (blinkVariation > 0.1) {
            score += 0.3;
        }
        factors++;
        // Head movement factor
        const headMovements = livenessData.map(d => d.headMovement);
        const yawVariation = this.calculateVariation(headMovements.map(h => h.yaw));
        const pitchVariation = this.calculateVariation(headMovements.map(h => h.pitch));
        if (yawVariation > 5 || pitchVariation > 5) {
            score += 0.4;
        }
        factors++;
        // Face depth consistency factor
        const depthVariation = this.calculateVariation(livenessData.map(d => d.faceDepth));
        const avgDepth = livenessData.reduce((sum, d) => sum + d.faceDepth, 0) / livenessData.length;
        const depthConsistency = 1 - (depthVariation / avgDepth);
        if (depthConsistency > 0.8) {
            score += 0.3;
        }
        factors++;
        return score / factors;
    }
    calculateVariation(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
}
exports.LivenessDetectionService = LivenessDetectionService;
exports.livenessDetectionService = new LivenessDetectionService();
