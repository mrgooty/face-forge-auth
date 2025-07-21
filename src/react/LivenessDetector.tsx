import React from 'react';

export interface LivenessDetectorProps {
  isActive: boolean;
  onLivenessScore: (score: number) => void;
  config: any;
}

export const LivenessDetector: React.FC<LivenessDetectorProps> = (props) => {
  // Placeholder: actual implementation should be imported/copied from face-forge-frontend
  return (
    <div>
      <h4>Liveness Detector (SDK Placeholder)</h4>
      {/* Liveness status UI goes here */}
    </div>
  );
};
