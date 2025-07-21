# FaceForge Auth SDK

A production-grade, privacy-first biometric authentication SDK for React and browser apps. Provides robust face verification and liveness detection using TensorFlow.js, with encrypted biometric data and fully extensible challenge and UI flows.

---

## Features
- **Real-time liveness detection** (blink, head movement, smile, mouth open, etc.)
- **Registration and sign-in** with robust challenge-response
- **AES-GCM encryption** of all biometric data (Web Crypto API)
- **Configurable challenge types, order, and UI**
- **Expose real-time face bounding box, landmarks, and confidence**
- **Custom overlays and challenge UI**
- **Granular feedback and error codes**
- **Programmatic start/stop/reset**
- **Access to raw camera stream**
- **TypeScript support** and JSDoc
- **No raw images stored**—only feature vectors and liveness metadata
- **GDPR/CCPA compliant** (when backend is implemented accordingly)
- **Mock/testing mode** for automated tests and demos
- **Accessibility/i18n**: All UI strings and ARIA labels customizable

---

## Installation

```bash
npm install @face-forge-npm/face-forge-auth
```

---

## Usage

### 1. Import and Initialize

```typescript
import { BiometricVerifier, BiometricVerifierHandle } from '@face-forge-npm/face-forge-auth';
import React, { useRef } from 'react';

const verifierRef = useRef<BiometricVerifierHandle>(null);
```

### 2. Registration/Verification Flow with Full Extensibility

```tsx
<BiometricVerifier
  userId="user123"
  mode="registration"
  challenges={['blink', 'smile']}
  onFaceDetection={faceData => {
    // Use faceData.boundingBox, faceData.landmarks, etc. for overlays or feedback
  }}
  onStatusChange={status => {
    // Show granular feedback or error messages
  }}
  renderOverlay={faceData => (
    <OvalOverlay boundingBox={faceData.boundingBox} />
  )}
  renderChallenge={(challenge, state) => (
    <CustomChallengeUI challenge={challenge} state={state} />
  )}
  messages={{
    loading: "Camera loading...",
    alignFace: "Please center your face",
    performChallenge: "Do the challenge!",
    success: "You're verified!",
    livenessFail: "Try again",
    multipleFaces: "Only one face please",
    noFace: "No face detected",
    cameraError: "Camera error",
    detectionError: "Detection error",
    unsupported: "Browser not supported",
    cameraPreview: "Camera preview"
  }}
  mockMode={process.env.NODE_ENV === 'test'}
  onCameraStream={stream => {
    // Use the raw MediaStream if needed
  }}
  ref={verifierRef}
/>
```

### 3. Programmatic Control

```typescript
verifierRef.current?.start();
verifierRef.current?.stop();
verifierRef.current?.reset();
```

---

## API

### `BiometricVerifier` Props
- `userId`, `mode`, `onVerificationComplete`, `onVerificationError`: Core props
- `challenges`: Array of challenge types and order (e.g., `['blink', 'smile']`)
- `onFaceDetection`: Real-time callback with `{ boundingBox, landmarks, confidence, multiple }`
- `onStatusChange`: Callback for granular feedback and error codes
- `renderOverlay`: Render prop for custom overlays (receives face data)
- `renderChallenge`: Render prop for custom challenge UI
- `mockMode`: Simulate face/liveness for testing
- `messages`: All UI strings and ARIA labels
- `onCameraStream`: Callback with raw `MediaStream`
- `ref`: Exposes `start`, `stop`, `reset` methods

### `BiometricVerifierHandle` (ref)
- `start()`: Begin detection/verification
- `stop()`: Pause detection
- `reset()`: Reset state and challenge flow

---

## Advanced Developer UX
- **Dynamic overlays**: Enforce face-in-oval, show real-time feedback
- **Custom challenge flows**: Tailor liveness to your app’s needs
- **Granular error/status**: Show “Face too close”, “Multiple faces”, etc.
- **Testing/mock mode**: Simulate results for CI or demos
- **Accessibility/i18n**: All UI and ARIA text is customizable
- **Raw camera access**: Integrate with your own analytics or effects

---

## Security & Privacy
- All biometric data is encrypted in the browser before returning.
- No raw images are stored—only feature vectors and liveness metadata.
- You can configure required challenges, thresholds, and timeouts via the `config` parameter.
- Fully GDPR/CCPA compliant if you handle backend storage/deletion properly.

---

## License
MIT 