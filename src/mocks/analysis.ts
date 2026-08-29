import type { AnalysisStep } from '@/types';

export const analysisSteps: AnalysisStep[] = [
  { id: 'step-1', label: 'Image Processing', status: 'pending' },
  { id: 'step-2', label: 'Product Detection', status: 'pending' },
  { id: 'step-3', label: 'Text Extraction', status: 'pending' },
  { id: 'step-4', label: 'Declaration Detection', status: 'pending' },
  { id: 'step-5', label: 'Rule Validation', status: 'pending' },
  { id: 'step-6', label: 'Compliance Assessment', status: 'pending' },
];

export function simulateAnalysis(onProgress: (steps: AnalysisStep[]) => void): Promise<void> {
  // Return a promise that simulates the analysis pipeline
  // Each step takes 600-1200ms to complete
  // Update steps sequentially: pending -> processing -> completed
  // Call onProgress after each step transition
  return new Promise((resolve) => {
    const steps = [...analysisSteps];
    let currentStep = 0;
    
    const processStep = () => {
      if (currentStep >= steps.length) {
        resolve();
        return;
      }
      steps[currentStep] = { ...steps[currentStep], status: 'processing' };
      onProgress([...steps]);
      
      setTimeout(() => {
        steps[currentStep] = { ...steps[currentStep], status: 'completed' };
        onProgress([...steps]);
        currentStep++;
        setTimeout(processStep, 200);
      }, 600 + Math.random() * 600);
    };
    
    setTimeout(processStep, 500);
  });
}
