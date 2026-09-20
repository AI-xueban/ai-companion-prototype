import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PlannerState, MOCK_DIAGNOSIS, PlanConfig } from './types';
import { DiagnosticView } from './DiagnosticView';
import { TuningView } from './TuningView';
import { BlueprintView } from './BlueprintView';

interface PlannerContainerProps {
  onClose: () => void;
  onCommit: (config: PlanConfig) => void;
}

export const PlannerContainer: React.FC<PlannerContainerProps> = ({ onClose, onCommit }) => {
  const [state, setState] = useState<PlannerState>({
    currentStep: 1,
    config: {
      mode: 'standard',
      type: 'weakness',
      selectedTopics: MOCK_DIAGNOSIS.recommendedTopics.map(t => t.id),
      durationDays: 14,
      dailyMinutes: 25,
    },
    diagnosis: MOCK_DIAGNOSIS,
  });

  const nextStep = () => setState(s => ({ ...s, currentStep: (s.currentStep + 1) as 1 | 2 | 3 }));
  const prevStep = () => setState(s => ({ ...s, currentStep: (s.currentStep - 1) as 1 | 2 | 3 }));
  
  const updateConfig = (updates: Partial<PlanConfig>) => {
    setState(s => ({ ...s, config: { ...s.config, ...updates } }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md h-[600px] bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/40"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20">
          {/* Step Indicators */}
          <div className="flex gap-2">
            {[1, 2, 3].map(step => (
              <div 
                key={step}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  step === state.currentStep ? 'w-8 bg-black/80' : 
                  step < state.currentStep ? 'w-1.5 bg-black/80' : 'w-1.5 bg-black/10'
                }`}
              />
            ))}
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors backdrop-blur-md"
          >
            <X size={16} className="text-black/60" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {state.currentStep === 1 && (
              <DiagnosticView 
                key="step1" 
                diagnosis={state.diagnosis} 
                onNext={nextStep} 
              />
            )}
            {state.currentStep === 2 && (
              <TuningView 
                key="step2" 
                config={state.config} 
                diagnosis={state.diagnosis}
                onUpdate={updateConfig}
                onNext={nextStep}
              />
            )}
            {state.currentStep === 3 && (
              <BlueprintView 
                key="step3" 
                config={state.config} 
                diagnosis={state.diagnosis}
                onBack={prevStep}
                onCommit={() => onCommit(state.config)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

