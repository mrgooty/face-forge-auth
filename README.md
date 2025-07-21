# @face-forge-npm/face-forge-auth

A scalable, private React + TensorFlow.js biometric verification and liveness detection SDK.

## Features
- Embeddable React components for biometric/liveness flows
- In-browser TensorFlow.js face detection and liveness
- AES-GCM encryption for all biometric data
- Strong TypeScript types and modular API
- Designed for secure, cloud-ready, and privacy-first deployments

## Installation

```
npm install @face-forge-npm/face-forge-auth
```

> You must be logged in to NPM with access to the private package.

## Usage

```tsx
import { BiometricVerifier } from '@face-forge-npm/face-forge-auth';

<BiometricVerifier
  userId={userId}
  mode="verification"
  onVerificationComplete={handleResult}
  onVerificationError={handleError}
/>
```

## API
- **BiometricVerifier**: Main React component for registration/verification
- **tensorflowService**: ML service for face/liveness detection
- **encryptData, generateKey**: Utilities for encrypting biometric data
- **Types**: All biometric, liveness, and challenge types exported

## Security Notes
- All biometric data is encrypted in-browser before network transfer
- No sensitive data is stored or transmitted unencrypted
- Only install and use this package in secure, trusted environments

## Publishing & Versioning
- Semantic versioning (major.minor.patch)
- Private, organization-scoped package (`@face-forge-npm/face-forge-auth`)
- To publish: `npm publish --access=restricted`

## License
MIT 