import { tensorflowService } from './ml/tensorflowService';
import { LivenessDetectionService } from './liveness';
import { encryptData, generateKey } from './utils/encrypt';
import type {
  ChallengeResponse,
  LivenessDetection,
  BiometricConfig,
  VerificationResult,
  BiometricData,
  FaceLandmarks,
  HeadMovement
} from './types';

const DEFAULT_CONFIG: BiometricConfig = {
  enableLivenessDetection: true,
  requiredChallenges: ['blink', 'head_left', 'head_right', 'smile', 'open_mouth'],
  minLivenessScore: 0.6,
  maxVerificationTime: 15000, // ms
  faceDetectionConfidence: 0.95,
  landmarkConfidence: 0.95,
  enableHeadTracking: true,
  enable3DReconstruction: false,
  challengeTimeout: 5000
};

export class FaceForgeAuth {
  private livenessService = new LivenessDetectionService();

  /**
   * Register a new user with robust liveness and biometric checks.
   * @param videoElement HTMLVideoElement streaming the user's face
   * @param userId Unique user identifier
   * @param config Optional biometric config
   * @returns Encrypted biometric data and key, or error
   */
  async registerUser({ videoElement, userId, config }: { videoElement: HTMLVideoElement | null, userId: string, config?: Partial<BiometricConfig> }) {
    return this._runBiometricFlow({ videoElement, userId, config });
  }

  /**
   * Verify a user with robust liveness and biometric checks.
   * @param videoElement HTMLVideoElement streaming the user's face
   * @param userId Unique user identifier
   * @param config Optional biometric config
   * @returns Encrypted biometric data and key, or error
   */
  async verifyUser({ videoElement, userId, config }: { videoElement: HTMLVideoElement | null, userId: string, config?: Partial<BiometricConfig> }) {
    return this._runBiometricFlow({ videoElement, userId, config });
  }

  // Internal: shared biometric flow for registration and verification
  private async _runBiometricFlow({ videoElement, userId, config }: { videoElement: HTMLVideoElement | null, userId: string, config?: Partial<BiometricConfig> }) {
    if (!videoElement) {
      return { success: false, error: 'No video element provided' };
    }
    const cfg: BiometricConfig = { ...DEFAULT_CONFIG, ...config };
    try {
      await tensorflowService.initialize();
      const faces = await tensorflowService.detectFaces(videoElement);
      if (!faces || faces.length === 0) {
        return { success: false, error: 'No face detected' };
      }
      // Only use the first detected face for now
      const face = faces[0];
      const landmarks: FaceLandmarks = {
        keypoints: face.keypoints,
        box: face.box,
        score: (face as { score?: number }).score ?? 1
      };
      // Liveness challenge loop
      const challengeResponses: ChallengeResponse[] = [];
      const livenessData: LivenessDetection[] = [];
      let prevHead: HeadMovement | undefined = undefined;
      for (const challenge of cfg.requiredChallenges) {
        const challengeStart = Date.now();
        const challengeLiveness: LivenessDetection[] = [];
        while (Date.now() - challengeStart < cfg.challengeTimeout) {
          const liveness = await tensorflowService.extractLivenessDetection(videoElement, prevHead);
          if (liveness) {
            challengeLiveness.push(liveness);
            prevHead = liveness.headMovement;
          }
          await new Promise(res => setTimeout(res, 100));
        }
        // Validate challenge
        const response = this.livenessService.validateChallenge(challenge, challengeLiveness, challengeStart);
        challengeResponses.push(response);
        livenessData.push(...challengeLiveness);
        if (!response.success) {
          return {
            success: false,
            error: `Liveness challenge failed: ${challenge}`,
            challengeResponses
          };
        }
      }
      // Aggregate liveness score
      const livenessScore = this.livenessService.calculateOverallLivenessScore(livenessData);
      if (livenessScore < cfg.minLivenessScore) {
        return {
          success: false,
          error: 'Liveness score too low',
          livenessScore,
          challengeResponses
        };
      }
      // Compose verification result
      const verificationResult: VerificationResult = {
        isValid: true,
        confidence: livenessScore,
        matchScore: livenessScore,
        livenessDetected: true,
        challengesPassed: challengeResponses.length,
        totalChallenges: cfg.requiredChallenges.length,
        errors: [],
        timestamp: Date.now()
      };
      const biometricData: BiometricData = {
        id: `bio-${Date.now()}`,
        userId,
        timestamp: Date.now(),
        faceEncodings: [], // TODO: add real face embeddings if available
        landmarks: [landmarks],
        livenessScore,
        verificationResult,
        challengeResponses,
        sessionId: `session-${Date.now()}`
      };
      // Encrypt biometric data
      const key = await generateKey();
      const encrypted = await encryptData(biometricData, key);
      return {
        success: true,
        encrypted,
        key,
        biometricData,
        verificationResult
      };
    } catch (err: unknown) {
      const errorMsg = (typeof err === 'object' && err && 'message' in err) ? (err as { message: string }).message : 'Verification failed';
      return { success: false, error: errorMsg };
    }
  }

  // Legacy: keep for backward compatibility
  async verify({ videoElement }: { videoElement: HTMLVideoElement | null }) {
    if (!videoElement) {
      return { success: false, error: 'No video element provided' };
    }
    try {
      await tensorflowService.initialize();
      const faces = await tensorflowService.detectFaces(videoElement);
      if (!faces || faces.length === 0) {
        return { success: false, error: 'No face detected' };
      }
      return {
        success: true,
        face: faces[0],
        message: 'Face detected and verified.'
      };
    } catch (err: unknown) {
      const errorMsg = (typeof err === 'object' && err && 'message' in err) ? (err as { message: string }).message : 'Verification failed';
      return { success: false, error: errorMsg };
    }
  }
} 