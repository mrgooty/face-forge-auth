'use client';
import React, {
  useRef, useState, useEffect, useImperativeHandle, forwardRef
} from 'react';
import { tensorflowService } from '../ml/tensorflowService';
import { encryptData, generateKey } from '../utils/encrypt';
import { LivenessDetectionService } from '../liveness';
import type {
  BiometricData,
  ChallengeResponse,
  LivenessDetection,
  FaceLandmarks
} from '../types';

export interface BiometricVerifierProps {
  userId: string;
  mode: 'registration' | 'verification';
  onVerificationComplete: (result: any) => void;
  onVerificationError: (error: Error) => void;
  className?: string;
  // New extensibility props:
  onFaceDetection?: (faceData: {
    boundingBox: any;
    landmarks: any;
    confidence: number;
    multiple: boolean;
  }) => void;
  onStatusChange?: (status: { code: string; message: string }) => void;
  challenges?: Array<'blink' | 'head_left' | 'head_right' | 'smile' | 'open_mouth'>;
  renderOverlay?: (faceData: any) => React.ReactNode;
  renderChallenge?: (challenge: string, state: any) => React.ReactNode;
  mockMode?: boolean;
  messages?: Record<string, string>;
  onCameraStream?: (stream: MediaStream) => void;
}

export interface BiometricVerifierHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const livenessDetectionService = new LivenessDetectionService();

export const BiometricVerifier = forwardRef<BiometricVerifierHandle, BiometricVerifierProps>(
  (
    {
      userId,
      mode,
      onVerificationComplete,
      onVerificationError,
      className,
      onFaceDetection,
      onStatusChange,
      challenges = ['blink', 'head_left', 'head_right', 'smile', 'open_mouth'],
      renderOverlay,
      renderChallenge,
      mockMode = false,
      messages = {},
      onCameraStream
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'detecting' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [challengeResult, setChallengeResult] = useState<ChallengeResponse | null>(null);
    const [livenessScore, setLivenessScore] = useState<number>(0);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceData, setFaceData] = useState<any>(null);
    const [running, setRunning] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [challengeState, setChallengeState] = useState<any>({});

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      start: () => {
        setRunning(true);
        setStatus('detecting');
      },
      stop: () => {
        setRunning(false);
        setStatus('idle');
      },
      reset: () => {
        setChallengeIdx(0);
        setChallengeResult(null);
        setLivenessScore(0);
        setStatus('idle');
        setError(null);
      }
    }), []);

    // Accessibility: Announce status changes
    useEffect(() => {
      if (status === 'error' && error) {
        window.alert(error);
      }
      if (onStatusChange) {
        onStatusChange({ code: status, message: error || status });
      }
    }, [status, error, onStatusChange]);

    // Camera and ML initialization
    useEffect(() => {
      let localStream: MediaStream | null = null;
      let isMounted = true;
      async function startCamera() {
        try {
          setStatus('loading');
          localStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(localStream);
          if (onCameraStream) onCameraStream(localStream);
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
            await videoRef.current.play();
          }
          setStatus('detecting');
          await tensorflowService.initialize();
          setRunning(true);
        } catch (err) {
          setError(messages.cameraError || 'Camera access denied or unavailable');
          setStatus('error');
          onVerificationError(err as Error);
        }
      }
      startCamera();
      return () => {
        isMounted = false;
        setRunning(false);
        if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream)
            .getTracks().forEach(track => track.stop());
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Main detection loop
    useEffect(() => {
      if (!running || !videoRef.current) return;
      let stop = false;
      async function detectLoop() {
        while (!stop && running && status === 'detecting') {
          try {
            let faces: any[] = [];
            if (mockMode) {
              // Simulate face detection
              faces = [{
                keypoints: [
                  { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 150, y: 200 }
                ],
                box: { xMin: 90, yMin: 90, xMax: 210, yMax: 210, width: 120, height: 120 },
                score: 0.99
              }];
            } else {
              faces = await tensorflowService.detectFaces(videoRef.current!);
            }
            setFaceDetected(faces.length > 0);
            setFaceData(faces[0] || null);
            if (onFaceDetection) {
              onFaceDetection({
                boundingBox: faces[0]?.box,
                landmarks: faces[0]?.keypoints,
                confidence: faces[0]?.score,
                multiple: faces.length > 1
              });
            }
            // Overlay support
            // (renderOverlay is handled in render)
            // Challenge flow
            if (faces.length > 0 && challengeIdx < challenges.length) {
              const currentChallenge = challenges[challengeIdx];
              if (onStatusChange) onStatusChange({ code: 'challenge', message: currentChallenge });
              if (renderChallenge) {
                setChallengeState({ challenge: currentChallenge, state: 'active' });
              }
              // Simulate liveness challenge validation (replace with real logic)
              const livenessData: LivenessDetection[] = [];
              const challengeStartTime = Date.now();
              const result = livenessDetectionService.validateChallenge(currentChallenge, livenessData, challengeStartTime);
              setChallengeResult(result);
              setLivenessScore(result.confidence);
              if (result.success) {
                if (onStatusChange) onStatusChange({ code: 'challenge_success', message: currentChallenge });
                setChallengeIdx(idx => idx + 1);
                if (onVerificationComplete && challengeIdx === challenges.length - 1) {
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
                      challengesPassed: challenges.length,
                      totalChallenges: challenges.length,
                      errors: [],
                      timestamp: Date.now()
                    },
                    challengeResponses: [result],
                    sessionId: `${userId}-session` // Placeholder
                  };
                  const key = await generateKey();
                  const encrypted = await encryptData(biometricData, key);
                  setStatus('success');
                  onVerificationComplete({ encrypted, key });
                  stop = true;
                  break;
                }
              } else {
                if (onStatusChange) onStatusChange({ code: 'challenge_fail', message: currentChallenge });
                setError(messages.livenessFail || 'Liveness challenge failed');
                setStatus('error');
                onVerificationError(new Error('Liveness challenge failed'));
                stop = true;
                break;
              }
            }
            // Granular feedback
            if (faces.length > 1 && onStatusChange) {
              onStatusChange({ code: 'MULTIPLE_FACES', message: messages.multipleFaces || 'Multiple faces detected' });
            }
            if (faces.length === 0 && onStatusChange) {
              onStatusChange({ code: 'NO_FACE', message: messages.noFace || 'No face detected' });
            }
          } catch (err) {
            setError(messages.detectionError || 'Face detection or liveness check failed');
            setStatus('error');
            onVerificationError(err as Error);
            break;
          }
          await new Promise(res => setTimeout(res, 300));
        }
      }
      detectLoop();
      return () => { stop = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running, status, challengeIdx, challenges, mockMode]);

    // Fallback UI for unsupported browsers
    const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices && !!window.crypto;
    if (!isSupported) {
      return <div role="alert">{messages.unsupported || 'Your browser does not support camera or required security features.'}</div>;
    }

    return (
      <div className={className}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', borderRadius: 8 }}
          aria-label={messages.cameraPreview || 'Live camera preview for biometric verification'}
        />
        {renderOverlay && faceData && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            {renderOverlay(faceData)}
          </div>
        )}
        <div role="status" aria-live="polite" style={{ marginTop: 8 }}>
          {status === 'loading' && <p>{messages.loading || 'Loading camera...'}</p>}
          {status === 'detecting' && !faceDetected && <p>{messages.alignFace || 'Align your face with the camera...'}</p>}
          {status === 'detecting' && faceDetected && challengeIdx < challenges.length && (
            renderChallenge
              ? renderChallenge(challenges[challengeIdx], challengeState)
              : <p>{messages.performChallenge || `Perform the challenge: ${challenges[challengeIdx]}`}</p>
          )}
          {status === 'success' && <p>{messages.success || 'Verification complete!'}</p>}
          {status === 'error' && <p>{error}</p>}
        </div>
      </div>
    );
  }
);
