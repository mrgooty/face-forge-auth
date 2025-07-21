"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricVerifier = void 0;
const react_1 = __importStar(require("react"));
const tensorflowService_1 = require("../ml/tensorflowService");
const encrypt_1 = require("../utils/encrypt");
const liveness_1 = require("../liveness");
const livenessDetectionService = new liveness_1.LivenessDetectionService();
const BiometricVerifier = ({ userId, mode, onVerificationComplete, onVerificationError, className }) => {
    const videoRef = (0, react_1.useRef)(null);
    const [status, setStatus] = (0, react_1.useState)('idle');
    const [error, setError] = (0, react_1.useState)(null);
    const [challenge, setChallenge] = (0, react_1.useState)(null);
    const [challengeResult, setChallengeResult] = (0, react_1.useState)(null);
    const [livenessScore, setLivenessScore] = (0, react_1.useState)(0);
    const [faceDetected, setFaceDetected] = (0, react_1.useState)(false);
    // Accessibility: Announce status changes
    (0, react_1.useEffect)(() => {
        if (status === 'error' && error) {
            window.alert(error);
        }
    }, [status, error]);
    // Camera and ML initialization
    (0, react_1.useEffect)(() => {
        let stream = null;
        let running = true;
        async function startCamera() {
            try {
                setStatus('loading');
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                setStatus('detecting');
                await tensorflowService_1.tensorflowService.initialize();
                runDetection();
            }
            catch (err) {
                setError('Camera access denied or unavailable');
                setStatus('error');
                onVerificationError(err);
            }
        }
        async function runDetection() {
            if (!videoRef.current)
                return;
            while (running && status === 'detecting') {
                try {
                    const faces = await tensorflowService_1.tensorflowService.detectFaces(videoRef.current);
                    setFaceDetected(faces.length > 0);
                    if (faces.length > 0 && !challenge) {
                        // Start a liveness challenge
                        setChallenge('blink');
                    }
                    if (faces.length > 0 && challenge) {
                        // Simulate liveness challenge validation
                        const livenessData = [];
                        const challengeStartTime = Date.now();
                        const result = livenessDetectionService.validateChallenge(challenge, livenessData, challengeStartTime);
                        setChallengeResult(result);
                        setLivenessScore(result.confidence);
                        if (result.success) {
                            // Prepare biometric data
                            const biometricData = {
                                id: `${userId}-${Date.now()}`,
                                userId,
                                timestamp: Date.now(),
                                faceEncodings: [[]], // Placeholder, real encodings needed
                                landmarks: faces.map(f => ({ keypoints: f.keypoints, box: f.box, score: f.score })),
                                livenessScore: result.confidence,
                                verificationResult: {
                                    isValid: true,
                                    confidence: result.confidence,
                                    matchScore: result.confidence,
                                    livenessDetected: result.success,
                                    challengesPassed: 1,
                                    totalChallenges: 1,
                                    errors: [],
                                    timestamp: Date.now()
                                },
                                challengeResponses: [result],
                                sessionId: `${userId}-session` // Placeholder
                            };
                            // Encrypt data
                            const key = await (0, encrypt_1.generateKey)();
                            const encrypted = await (0, encrypt_1.encryptData)(biometricData, key);
                            setStatus('success');
                            onVerificationComplete({ encrypted, key });
                            break;
                        }
                    }
                }
                catch (err) {
                    setError('Face detection or liveness check failed');
                    setStatus('error');
                    onVerificationError(err);
                    break;
                }
                await new Promise(res => setTimeout(res, 500));
            }
        }
        startCamera();
        return () => {
            running = false;
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject
                    .getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Fallback UI for unsupported browsers
    const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices && !!window.crypto;
    if (!isSupported) {
        return react_1.default.createElement("div", { role: "alert" }, "Your browser does not support camera or required security features.");
    }
    return (react_1.default.createElement("div", { className: className },
        react_1.default.createElement("video", { ref: videoRef, autoPlay: true, playsInline: true, style: { width: '100%', borderRadius: 8 }, "aria-label": "Live camera preview for biometric verification" }),
        react_1.default.createElement("div", { role: "status", "aria-live": "polite", style: { marginTop: 8 } },
            status === 'loading' && react_1.default.createElement("p", null, "Loading camera..."),
            status === 'detecting' && !faceDetected && react_1.default.createElement("p", null, "Align your face with the camera..."),
            status === 'detecting' && faceDetected && !challenge && react_1.default.createElement("p", null, "Face detected. Preparing liveness challenge..."),
            status === 'detecting' && challenge && react_1.default.createElement("p", null,
                "Perform the challenge: ",
                challenge),
            status === 'success' && react_1.default.createElement("p", null, "Verification complete!"),
            status === 'error' && react_1.default.createElement("p", null,
                "Error: ",
                error))));
};
exports.BiometricVerifier = BiometricVerifier;
