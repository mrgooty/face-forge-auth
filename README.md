# FaceForge Auth SDK

A production-grade, privacy-first biometric authentication SDK for React and browser apps. Provides robust face verification and liveness detection using TensorFlow.js, with encrypted biometric data and configurable challenge flows.

---

## Features
- **Real-time liveness detection** (blink, head movement, smile, mouth open, etc.)
- **Registration and sign-in** with robust challenge-response
- **AES-GCM encryption** of all biometric data (Web Crypto API)
- **Configurable challenge types, thresholds, and timeouts**
- **TypeScript support** and JSDoc
- **No raw images stored**—only feature vectors and liveness metadata
- **GDPR/CCPA compliant** (when backend is implemented accordingly)

---

## Installation

```bash
npm install @face-forge-npm/face-forge-auth
```

---

## Usage

### 1. Import and Initialize

```typescript
import { FaceForgeAuth } from '@face-forge-npm/face-forge-auth';

const faceForgeAuth = new FaceForgeAuth();
```

### 2. Registration Flow

```typescript
const regResult = await faceForgeAuth.registerUser({
  videoElement: document.getElementById('video') as HTMLVideoElement,
  userId: 'user123',
  // Optional: config overrides
  // config: { requiredChallenges: ['blink', 'smile'], minLivenessScore: 0.7 }
});
if (regResult.success) {
  // Send regResult.encrypted to your backend for storage
  // Store regResult.key securely on client (or use for session)
}
```

### 3. Sign-In / Verification Flow

```typescript
const signInResult = await faceForgeAuth.verifyUser({
  videoElement: document.getElementById('video') as HTMLVideoElement,
  userId: 'user123'
});
if (signInResult.success && signInResult.verificationResult.livenessDetected) {
  // Compare signInResult.biometricData to stored template on backend
  // If match, authenticate user
}
```

---

## API

### `registerUser({ videoElement, userId, config? })`
- Runs all liveness challenges in real time using the webcam.
- Collects and validates liveness data for each challenge.
- Aggregates a liveness score.
- Returns:
  - `success: true/false`
  - `encrypted`: Encrypted biometric data (AES-GCM)
  - `key`: CryptoKey for decryption
  - `biometricData`: Raw (unencrypted) biometric data (for testing, not for storage)
  - `verificationResult`: Challenge/liveness summary

### `verifyUser({ videoElement, userId, config? })`
- Same as above, but for sign-in/verification.

### `config` options
- `requiredChallenges`: Array of challenge types (e.g., `['blink', 'head_left', 'smile']`)
- `minLivenessScore`: Minimum score to pass (0–1)
- `challengeTimeout`: Time per challenge (ms)

---

## Security & Privacy
- All biometric data is encrypted in the browser before returning.
- No raw images are stored—only feature vectors and liveness metadata.
- You can configure required challenges, thresholds, and timeouts via the `config` parameter.
- Fully GDPR/CCPA compliant if you handle backend storage/deletion properly.

---

## Advanced
- Integrate with your backend for template storage and matching.
- Optionally, implement face embedding extraction for true biometric matching (not just liveness).
- Add fallback UI and error handling for production.

---

## License
MIT 