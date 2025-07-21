import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// import * as blazeface from '@tensorflow-models/blazeface';
import type { LivenessDetection, HeadMovement } from '../types';

let faceDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
// let blazefaceModel: blazeface.BlazeFaceModel | null = null;

export class TensorFlowService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await tf.setBackend('webgl');
    await tf.ready();
    faceDetector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'tfjs',
        refineLandmarks: true // Required for linter and best accuracy
      }
    );
    // blazefaceModel = await blazeface.load();
    this.initialized = true;
  }

  async detectFaces(video: HTMLVideoElement): Promise<faceLandmarksDetection.Face[]> {
    if (!faceDetector) throw new Error('TensorFlowService not initialized');
    return await faceDetector.estimateFaces(video, { flipHorizontal: false });
  }

  async detectFaceLandmarks(video: HTMLVideoElement): Promise<faceLandmarksDetection.Face[]> {
    if (!faceDetector) throw new Error('TensorFlowService not initialized');
    return await faceDetector.estimateFaces(video, { flipHorizontal: false });
  }

  /**
   * Extracts liveness signals (blink, mouth open, head movement, etc.) from a single video frame.
   * Returns a LivenessDetection object for the current frame.
   */
  async extractLivenessDetection(video: HTMLVideoElement, prevHead?: HeadMovement): Promise<LivenessDetection | null> {
    if (!faceDetector) throw new Error('TensorFlowService not initialized');
    const faces = await faceDetector.estimateFaces(video, { flipHorizontal: false });
    if (!faces.length) return null;
    const face = faces[0] as faceLandmarksDetection.Face;
    // Calculate eye aspect ratio (EAR) for blink detection
    // MediaPipe FaceMesh: left eye [33, 160, 158, 133, 153, 144], right eye [362, 385, 387, 263, 373, 380]
    const getEAR = (indices: number[]) => {
      const p = indices.map(i => face.keypoints[i]);
      if (p.some(pt => !pt)) return 0;
      const vertical = Math.abs(p[1].y - p[5].y) + Math.abs(p[2].y - p[4].y);
      const horizontal = Math.abs(p[0].x - p[3].x);
      return vertical / (2.0 * horizontal);
    };
    const leftEAR = getEAR([33, 160, 158, 133, 153, 144]);
    const rightEAR = getEAR([362, 385, 387, 263, 373, 380]);
    const eyeAspectRatio = (leftEAR + rightEAR) / 2;
    // Calculate mouth aspect ratio (MAR) for mouth open/smile
    // MediaPipe FaceMesh: upper lip [13], lower lip [14], left [78], right [308]
    const upperLip = face.keypoints[13];
    const lowerLip = face.keypoints[14];
    const leftMouth = face.keypoints[78];
    const rightMouth = face.keypoints[308];
    let mouthAspectRatio = 0;
    if (upperLip && lowerLip && leftMouth && rightMouth) {
      const vertical = Math.abs(upperLip.y - lowerLip.y);
      const horizontal = Math.abs(leftMouth.x - rightMouth.x);
      mouthAspectRatio = vertical / horizontal;
    }
    // Head pose (yaw, pitch, roll) - use face.rotation if available, else estimate
    const yaw = 'yaw' in face ? (face as Record<string, number>).yaw : 0;
    const pitch = 'pitch' in face ? (face as Record<string, number>).pitch : 0;
    const roll = 'roll' in face ? (face as Record<string, number>).roll : 0;
    const headMovement: HeadMovement = {
      yaw,
      pitch,
      roll,
      deltaYaw: prevHead ? yaw - prevHead.yaw : 0,
      deltaPitch: prevHead ? pitch - prevHead.pitch : 0,
      deltaRoll: prevHead ? roll - prevHead.roll : 0
    };
    // Face depth (z) - use average z of keypoints3D if available
    let faceDepth = 1;
    if ('keypoints3D' in face && Array.isArray((face as { keypoints3D?: { z?: number }[] }).keypoints3D) && (face as { keypoints3D?: { z?: number }[] }).keypoints3D!.length > 0) {
      const keypoints3D = (face as { keypoints3D: { z?: number }[] }).keypoints3D;
      faceDepth = keypoints3D.reduce((sum: number, pt) => sum + (pt.z || 0), 0) / keypoints3D.length;
    }
    // Blink detection: EAR below threshold (e.g., 0.25)
    const blinkDetected = eyeAspectRatio < 0.25;
    // Compose liveness detection object
    const liveness: LivenessDetection = {
      blinkDetected,
      blinkCount: blinkDetected ? 1 : 0,
      headMovement,
      faceDepth,
      eyeAspectRatio,
      mouthAspectRatio,
      timestamp: Date.now()
    };
    return liveness;
  }
}

export const tensorflowService = new TensorFlowService();
