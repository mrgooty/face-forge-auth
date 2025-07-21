import React from 'react';

export interface ChallengeIndicatorProps {
  challenge: string;
  progress: number;
  isActive: boolean;
  onChallengeComplete: (success: boolean) => void;
}

export const ChallengeIndicator: React.FC<ChallengeIndicatorProps> = (props) => {
  // Placeholder: actual implementation should be imported/copied from face-forge-frontend
  return (
    <div>
      <h4>Challenge Indicator (SDK Placeholder)</h4>
      {/* Challenge UI goes here */}
    </div>
  );
};
