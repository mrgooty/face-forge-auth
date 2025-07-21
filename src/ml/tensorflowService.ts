import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as blazeface from '@tensorflow-models/blazeface';

let faceDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let blazefaceModel: blazeface.BlazeFaceModel | null = null;

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
    blazefaceModel = await blazeface.load();
    this.initialized = true;
  }

  async detectFaces(video: HTMLVideoElement): Promise<any[]> {
    if (!faceDetector) throw new Error('TensorFlowService not initialized');
    return await faceDetector.estimateFaces(video, { flipHorizontal: false });
  }

  async detectFaceLandmarks(video: HTMLVideoElement): Promise<any[]> {
    if (!faceDetector) throw new Error('TensorFlowService not initialized');
    return await faceDetector.estimateFaces(video, { flipHorizontal: false });
  }

  async detectLivenessSignals(video: HTMLVideoElement): Promise<any> {
    // Example: blink, mouth open, head movement, etc.
    // This is a placeholder; real implementation should analyze landmarks over time
    const faces = await this.detectFaceLandmarks(video);
    if (!faces.length) return { blink: false, mouthOpen: false };
    // Analyze landmarks for blink/mouth open (implement as needed)
    return { blink: false, mouthOpen: false };
  }
}

export const tensorflowService = new TensorFlowService();
