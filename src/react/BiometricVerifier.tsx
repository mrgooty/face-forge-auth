'use client';
import React, { useRef, useState, useEffect } from 'react';
import { tensorflowService } from '../ml/tensorflowService';
import { encryptData, generateKey } from '../utils/encrypt';
import { LivenessDetectionService } from '../liveness';
import type { BiometricData, ChallengeResponse, LivenessDetection } from '../types';

export interface BiometricVerifierProps {
  userId: string;
  mode: 'registration' | 'verification';
  onVerificationComplete: (result: any) => void;
  onVerificationError: (error: Error) => void;
  className?: string;
}

const livenessDetectionService = new LivenessDetectionService();

export const BiometricVerifier: React.FC<BiometricVerifierProps> = ({
  userId, mode, onVerificationComplete, onVerificationError, className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'detecting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<'blink' | 'head_left' | 'head_right' | 'smile' | null>(null);
  const [challengeResult, setChallengeResult] = useState<ChallengeResponse | null>(null);
  const [livenessScore, setLivenessScore] = useState<number>(0);
  const [faceDetected, setFaceDetected] = useState(false);

  // Accessibility: Announce status changes
  useEffect(() => {
    if (status === 'error' && error) {
      window.alert(error);
    }
  }, [status, error]);

  // Camera and ML initialization
  useEffect(() => {
    let stream: MediaStream | null = null;
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
        await tensorflowService.initialize();
        runDetection();
      } catch (err) {
        setError('Camera access denied or unavailable');
        setStatus('error');
        onVerificationError(err as Error);
      }
    }
    async function runDetection() {
      if (!videoRef.current) return;
      while (running && status === 'detecting') {
        try {
          const faces = await tensorflowService.detectFaces(videoRef.current);
          setFaceDetected(faces.length > 0);
          if (faces.length > 0 && !challenge) {
            // Start a liveness challenge
            setChallenge('blink');
          }
          if (faces.length > 0 && challenge) {
            // Simulate liveness challenge validation
            const livenessData: LivenessDetection[] = [];
            const challengeStartTime = Date.now();
            const result = livenessDetectionService.validateChallenge(challenge, livenessData, challengeStartTime);
            setChallengeResult(result);
            setLivenessScore(result.confidence);
            if (result.success) {
              // Prepare biometric data
              const biometricData: BiometricData = {
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
              const key = await generateKey();
              const encrypted = await encryptData(biometricData, key);
              setStatus('success');
              onVerificationComplete({ encrypted, key });
              break;
            }
          }
        } catch (err) {
          setError('Face detection or liveness check failed');
          setStatus('error');
          onVerificationError(err as Error);
          break;
        }
        await new Promise(res => setTimeout(res, 500));
      }
    }
    startCamera();
    return () => {
      running = false;
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback UI for unsupported browsers
  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices && !!window.crypto;
  if (!isSupported) {
    return <div role="alert">Your browser does not support camera or required security features.</div>;
  }

  return (
    <div className={className}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', borderRadius: 8 }}
        aria-label="Live camera preview for biometric verification"
      />
      <div role="status" aria-live="polite" style={{ marginTop: 8 }}>
        {status === 'loading' && <p>Loading camera...</p>}
        {status === 'detecting' && !faceDetected && <p>Align your face with the camera...</p>}
        {status === 'detecting' && faceDetected && !challenge && <p>Face detected. Preparing liveness challenge...</p>}
        {status === 'detecting' && challenge && <p>Perform the challenge: {challenge}</p>}
        {status === 'success' && <p>Verification complete!</p>}
        {status === 'error' && <p>Error: {error}</p>}
      </div>
      {/* Add more challenge UI, progress, and accessibility features as needed */}
    </div>
  );
};
