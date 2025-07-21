import React from 'react';

export interface FaceScannerProps {
  isActive: boolean;
  onFaceDetected: (landmarks: any[]) => void;
  onLivenessData: (liveness: any) => void;
  config: any;
}

export const FaceScanner: React.FC<FaceScannerProps> = (props) => {
  // Placeholder: actual implementation should be imported/copied from face-forge-frontend
  return (
    <div>
      <h3>Face Scanner (SDK Placeholder)</h3>
      {/* Camera and face detection UI goes here */}
    </div>
  );
};
