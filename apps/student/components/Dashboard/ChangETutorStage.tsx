import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { TutorTwoPhaseBoard } from './TutorTwoPhaseBoard';

import { StepBoardView, TutorQuestionMeta } from '../../data/tutorTwoPhaseScript';

import { TutorCharacterTheme } from '../../data/tutorCharacterThemes';

import { DEEP_THINKING_STEPS } from '../../data/tutorCharacterCopy';

import { normalizeTutorDisplayText } from '../../utils/tutorDisplayText';



export interface ChangETutorStageProps {

  speechText: string;

  speechVisible?: boolean;

  boardSteps: StepBoardView[];

  isSpeaking: boolean;

  isWriting: boolean;

  theme: TutorCharacterTheme;

  boardPhaseLabel?: string;

  boardVariant?: 'skeleton' | 'guide';

  boardScrollable?: boolean;

  boardActiveStepIndex?: number;

  questionMeta?: TutorQuestionMeta;

  celebration?: boolean;

  thinkingQuestion?: string;

  deepThinking?: boolean;

  deepThinkingStep?: number;

  hintText?: string;

  footer?: React.ReactNode;

  className?: string;

}



export const ChangETutorStage: React.FC<ChangETutorStageProps> = ({

  speechText,

  speechVisible = false,

  boardSteps,

  isSpeaking,

  isWriting,

  theme,

  boardPhaseLabel,

  boardVariant = 'skeleton',

  boardScrollable = true,

  boardActiveStepIndex = -1,

  questionMeta,

  celebration = false,

  thinkingQuestion,

  deepThinking = false,

  deepThinkingStep = 0,

  hintText,

  footer,

  className = '',

}) => {

  // 1对1阶段改为纯对话输入输出，不展示右侧板书区
  const hasGuideBoardContent = boardVariant !== 'guide';

  return (

  <div className={`flex flex-col min-h-0 gap-3 ${className}`}>

    <AnimatePresence mode="wait">

      {thinkingQuestion ? (

        <motion.div

          key="thinking"

          initial={{ opacity: 0, y: 6 }}

          animate={{ opacity: 1, y: 0 }}

          exit={{ opacity: 0, y: -6 }}

          className={`shrink-0 self-start w-fit max-w-[min(100%,28rem)] rounded-xl border px-4 py-3 shadow-sm ${theme.thinkingBox}`}

        >

          <p className="text-[10px] text-slate-500 font-bold mb-1">你的回答</p>

          <p className="text-sm text-slate-800">{normalizeTutorDisplayText(thinkingQuestion)}</p>

          {deepThinking ? (

            <div className="mt-2.5 space-y-1">

              {DEEP_THINKING_STEPS.map((label, i) => (

                <p

                  key={label}

                  className={`text-[11px] transition-colors ${

                    i <= deepThinkingStep ? theme.accentText : 'text-slate-400'

                  } ${i === deepThinkingStep ? 'font-bold animate-pulse' : 'font-medium'}`}

                >

                  {i <= deepThinkingStep ? '✓' : '○'} {label}

                </p>

              ))}

            </div>

          ) : (

            <p className={`text-xs mt-2 animate-pulse ${theme.accentText}`}>

              {`${theme.name}正在看…`}

            </p>

          )}

        </motion.div>

      ) : speechVisible && speechText ? (

        <motion.div

          key={speechText.slice(0, 24)}

          initial={{ opacity: 0, y: 6 }}

          animate={{ opacity: 1, y: 0 }}

          exit={{ opacity: 0, y: -6 }}

          className={`shrink-0 self-start w-fit max-w-[min(100%,28rem)] rounded-xl border px-4 py-3 shadow-sm ${

              isSpeaking ? theme.speechActive : theme.speechIdle

            }`}

          >

          <div className="flex items-start gap-2">

            {isSpeaking && (

              <div className="flex gap-0.5 h-4 items-end shrink-0 pt-1">

                {[1, 2, 3].map((i) => (

                  <motion.div

                    key={i}

                    className={`w-0.5 rounded-full ${theme.accentWave}`}

                    animate={{ height: [4, 12, 5] }}

                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}

                  />

                ))}

              </div>

            )}

            <p className="text-sm md:text-[15px] text-slate-800 leading-relaxed font-medium tabular-nums lining-nums">

              {normalizeTutorDisplayText(speechText)}

              {isSpeaking && (

                <motion.span

                  animate={{ opacity: [1, 0] }}

                  transition={{ repeat: Infinity, duration: 0.8 }}

                  className={`inline-block w-0.5 h-4 ml-0.5 align-middle ${theme.accentWave}`}

                />

              )}

            </p>

          </div>

          {hintText ? (

            <p className={`text-xs mt-2 border-t pt-2 ${theme.speechHint}`}>💡 {hintText}</p>

          ) : null}

        </motion.div>

      ) : null}

    </AnimatePresence>



    {(hasGuideBoardContent || celebration) ? (
    <div className="relative">

      {celebration ? (

        <motion.div

          initial={{ opacity: 0, scale: 0.9 }}

          animate={{ opacity: 1, scale: 1 }}

          className="absolute -top-2 right-2 z-20 pointer-events-none flex gap-1"

          aria-hidden

        >

          {['🎉', '✨', '🌟'].map((emoji, i) => (

            <motion.span

              key={emoji}

              initial={{ y: 8, opacity: 0 }}

              animate={{ y: [-4, 0], opacity: 1 }}

              transition={{ delay: i * 0.12, duration: 0.4 }}

              className="text-lg"

            >

              {emoji}

            </motion.span>

          ))}

        </motion.div>

      ) : null}



      {hasGuideBoardContent ? (

      <TutorTwoPhaseBoard

        steps={boardSteps}

        isWriting={isWriting}

        theme={theme}

        variant={boardVariant}

        activeStepIndex={boardActiveStepIndex}

        phaseLabel={boardPhaseLabel}

        scrollable={boardScrollable}

        questionMeta={questionMeta}

        className={boardScrollable ? 'flex-1 min-h-[200px]' : 'shrink-0'}

      />

      ) : null}

    </div>
    ) : null}



    {footer}

  </div>

  );

};

