"use strict";
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
exports.tensorflowService = exports.TensorFlowService = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
const faceLandmarksDetection = __importStar(require("@tensorflow-models/face-landmarks-detection"));
const blazeface = __importStar(require("@tensorflow-models/blazeface"));
let faceDetector = null;
let blazefaceModel = null;
class TensorFlowService {
    constructor() {
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized)
            return;
        await tf.setBackend('webgl');
        await tf.ready();
        faceDetector = await faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
            runtime: 'tfjs',
            refineLandmarks: true // Required for linter and best accuracy
        });
        blazefaceModel = await blazeface.load();
        this.initialized = true;
    }
    async detectFaces(video) {
        if (!faceDetector)
            throw new Error('TensorFlowService not initialized');
        return await faceDetector.estimateFaces(video, { flipHorizontal: false });
    }
    async detectFaceLandmarks(video) {
        if (!faceDetector)
            throw new Error('TensorFlowService not initialized');
        return await faceDetector.estimateFaces(video, { flipHorizontal: false });
    }
    async detectLivenessSignals(video) {
        // Example: blink, mouth open, head movement, etc.
        // This is a placeholder; real implementation should analyze landmarks over time
        const faces = await this.detectFaceLandmarks(video);
        if (!faces.length)
            return { blink: false, mouthOpen: false };
        // Analyze landmarks for blink/mouth open (implement as needed)
        return { blink: false, mouthOpen: false };
    }
}
exports.TensorFlowService = TensorFlowService;
exports.tensorflowService = new TensorFlowService();
