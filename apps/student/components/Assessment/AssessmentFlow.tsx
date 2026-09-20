
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AssessmentStart } from './AssessmentStart';
import { AssessmentResult } from './AssessmentResult';
import { AssessmentStageHeader, CognitiveStage, StageSummary } from './AssessmentStages';
import { PathWeaving } from '../Onboarding/PathWeaving';
import { AssessmentPhase } from '../../types';

interface AssessmentFlowProps {
  onComplete: () => void;
  onCancel: () => void;
  userName: string;
  grade: string; // Passed from SplashScreen
}

export const AssessmentFlow: React.FC<AssessmentFlowProps> = ({ onComplete, onCancel, userName, grade }) => {
  const [phase, setPhase] = useState<AssessmentPhase>('launch');
  const [showSummary, setShowSummary] = useState(false);
  
  // Track specific summary data to show between stages
  const [summaryData, setSummaryData] = useState({ title: '', desc: '' });

  // Stage Transitions
  const handleStageComplete = (currentPhase: AssessmentPhase) => {
    // 统一只处理 cognitive 阶段，因为它现在包含了所有 8 个维度的测试
    const sTitle = '全维能力扫描完成';
    const sDesc = 'AI 已根据你的 8 大智能维度生成了专属认知模型。';

    setSummaryData({ title: sTitle, desc: sDesc });
    setShowSummary(true);
  };

  const advancePhase = () => {
      setShowSummary(false);
      // 直接跳转到路径生成动画，跳过原本的 academic/style
      setPhase('weaving');
  };

  const handleWeavingComplete = () => {
      // Show Final Result Dashboard
      setPhase('final_result');
  };

  return (
    <div className="w-full h-full bg-gray-900 relative overflow-hidden flex flex-col">
      
      {/* 1. Launch Screen */}
      {phase === 'launch' && (
        <AssessmentStart 
            onStart={() => setPhase('cognitive')} 
            onExit={onCancel}
            userName={userName}
        />
      )}

      {/* 2. Weaving Animation */}
      {phase === 'weaving' && (
          <PathWeaving onComplete={handleWeavingComplete} />
      )}
 
      {/* 3. Result Screen (The Grand Reveal) */}
      {phase === 'final_result' && (
         <AssessmentResult onFinish={onComplete} mode="initial" userName={userName} />
      )}

      {/* 5. Main Assessment Stages */}
      {phase === 'cognitive' && (
          <>
            {/* Stage Content Container：仅题目区域滚动 */}
            <div className="flex-1 relative overflow-y-auto no-scrollbar">
                <div className="min-h-full pb-20">
                    <AnimatePresence mode="wait">
                        {showSummary ? (
                            <StageSummary 
                                key="summary"
                                data={summaryData}
                                onNext={advancePhase}
                            />
                        ) : (
                            <CognitiveStage key="cog" onComplete={() => handleStageComplete('cognitive')} />
                        )}
                    </AnimatePresence>
                </div>
            </div>
          </>
      )}
    </div>
  );
};
