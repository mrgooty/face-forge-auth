// Biometric types (adapted from face-forge-frontend/src/types/biometric.ts)

export interface BiometricData {
  id: string;
  userId: string;
  timestamp: number;
  faceEncodings: number[][];
  landmarks: FaceLandmarks[];
  livenessScore: number;
  verificationResult: VerificationResult;
  challengeResponses: ChallengeResponse[];
  sessionId: string;
}

export interface FaceLandmarks {
  keypoints: Array<{
    x: number;
    y: number;
    z?: number;
    name?: string;
  }>;
  box: BoundingBox;
  score: number;
}

export interface BoundingBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  width: number;
  height: number;
}

export interface VerificationResult {
  isValid: boolean;
  confidence: number;
  matchScore: number;
  livenessDetected: boolean;
  challengesPassed: number;
  totalChallenges: number;
  errors: string[];
  timestamp: number;
}

export interface ChallengeResponse {
  challengeType: ChallengeType;
  requested: boolean;
  completed: boolean;
  success: boolean;
  confidence: number;
  duration: number;
  timestamp: number;
}

export type ChallengeType =
  | 'blink'
  | 'head_left'
  | 'head_right'
  | 'head_up'
  | 'head_down'
  | 'smile'
  | 'open_mouth'
  | 'frown';

export interface LivenessDetection {
  blinkDetected: boolean;
  blinkCount: number;
  headMovement: HeadMovement;
  faceDepth: number;
  eyeAspectRatio: number;
  mouthAspectRatio: number;
  timestamp: number;
}

export interface HeadMovement {
  yaw: number;
  pitch: number;
  roll: number;
  deltaYaw: number;
  deltaPitch: number;
  deltaRoll: number;
}

export interface BiometricSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  status: SessionStatus;
  challenges: ChallengeType[];
  currentChallenge?: ChallengeType;
  completedChallenges: ChallengeResponse[];
  verificationAttempts: number;
  maxAttempts: number;
  livenessData: LivenessDetection[];
  faceData: FaceLandmarks[];
}

export type SessionStatus =
  | 'initializing'
  | 'ready'
  | 'detecting_face'
  | 'challenge_active'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface BiometricConfig {
  enableLivenessDetection: boolean;
  requiredChallenges: ChallengeType[];
  minLivenessScore: number;
  maxVerificationTime: number;
  faceDetectionConfidence: number;
  landmarkConfidence: number;
  enableHeadTracking: boolean;
  enable3DReconstruction: boolean;
  challengeTimeout: number;
}

export interface Face3DModel {
  vertices: number[][];
  faces: number[][];
  texture?: ImageData;
  pose: {
    rotation: [number, number, number];
    translation: [number, number, number];
  };
  confidence: number;
}

// Database Schemas
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  biometric_enrolled: boolean;
  last_verification: string | null;
}

export interface BiometricProfile {
  id: string;
  user_id: string;
  face_encodings: number[][];
  reference_landmarks: FaceLandmarks[];
  enrollment_date: string;
  last_updated: string;
  verification_count: number;
  is_active: boolean;
}

export interface VerificationLog {
  id: string;
  user_id: string;
  session_id: string;
  verification_result: VerificationResult;
  biometric_data: BiometricData;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface BiometricError extends Error {
  code: BiometricErrorCode;
  details?: any;
}

export type BiometricErrorCode =
  | 'CAMERA_ACCESS_DENIED'
  | 'NO_FACE_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'POOR_LIGHTING'
  | 'FACE_TOO_SMALL'
  | 'FACE_TOO_LARGE'
  | 'LIVENESS_CHECK_FAILED'
  | 'CHALLENGE_TIMEOUT'
  | 'VERIFICATION_FAILED'
  | 'MODEL_LOAD_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// API Types
export interface VerifyFaceRequest {
  sessionId: string;
  faceData: BiometricData;
  userAgent: string;
}

export interface VerifyFaceResponse {
  success: boolean;
  result: VerificationResult;
  session: BiometricSession;
  message: string;
}

export interface RegisterFaceRequest {
  userId: string;
  faceData: BiometricData;
  sessionId: string;
}

export interface RegisterFaceResponse {
  success: boolean;
  profileId: string;
  message: string;
} 