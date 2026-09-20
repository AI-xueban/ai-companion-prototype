import React, { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { Annotatable } from '../Prototype/Annotatable';

const MAX_QUESTIONS = 40;
const PRESET_COUNTS = [5, 10, 15, 20, 30, 40];
const DIFFICULTIES = ['较易', '容易', '中等', '较难', '困难'] as const;
const SCENES = ['同步练习', '真题', '好题', '常考题', '压轴题', '易错题'] as const;

export type PracticeDifficulty = (typeof DIFFICULTIES)[number];
export type PracticeScene = (typeof SCENES)[number];

export type PracticeSetupValue = {
  questionCount: number;
  difficulty: PracticeDifficulty;
  scene: PracticeScene;
};

function clampCount(value: number) {
  return Math.min(MAX_QUESTIONS, Math.max(1, value));
}

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center justify-center rounded-xl border text-[13px] font-bold transition-colors ${
        active
          ? 'border-[#7B61FF] bg-[#7B61FF]/10 text-[#5B4AD1]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

export function PracticeSetupModal({
  open,
  recommendedCount,
  annotationId = 'dashboard.afterclass-assessment.setup',
  overlayClassName = 'absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4 py-6',
  onClose,
  onConfirm,
}: {
  open: boolean;
  recommendedCount: number;
  annotationId?: string;
  overlayClassName?: string;
  onClose: () => void;
  onConfirm: (value: PracticeSetupValue) => void;
}) {
  const recommended = clampCount(recommendedCount);
  const [questionCount, setQuestionCount] = useState(recommended);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('中等');
  const [scene, setScene] = useState<PracticeScene>('同步练习');

  useEffect(() => {
    if (!open) return;
    setQuestionCount(recommended);
    setDifficulty('中等');
    setScene('同步练习');
  }, [open, recommended]);

  if (!open) return null;

  const isRecommended = questionCount === recommended;

  return (
    <div className={overlayClassName} onClick={onClose}>
      <Annotatable annotationId={annotationId} className="w-full max-w-[520px]">
        <div
          className="flex max-h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 no-scrollbar">
            <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-[20px] font-black text-slate-900">先定题量、难度和场景</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <section className="mt-5">
              <h3 className="mb-3 text-[14px] font-black text-slate-800">题量</h3>
              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  disabled={questionCount <= 1}
                  onClick={() => setQuestionCount((current) => clampCount(current - 1))}
                  aria-label="减少题量"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={18} strokeWidth={2.6} />
                </button>
                <div className="min-w-[72px] text-center">
                  <p className="text-[40px] font-black leading-none text-slate-900">{questionCount}</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-400">
                    {isRecommended ? '推荐量' : '自定义'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={questionCount >= MAX_QUESTIONS}
                  onClick={() => setQuestionCount((current) => clampCount(current + 1))}
                  aria-label="增加题量"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={18} strokeWidth={2.6} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {PRESET_COUNTS.map((count) => {
                  const active = questionCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`h-8 rounded-full px-3 text-[12px] font-bold ${
                        active
                          ? 'bg-[#7B61FF]/12 text-[#5B4AD1]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {count}题
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setQuestionCount(recommended)}
                className={`mt-2 h-8 rounded-full px-3 text-[12px] font-bold ${
                  isRecommended
                    ? 'bg-[#7B61FF]/12 text-[#5B4AD1]'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {recommended}题 · 推荐
              </button>
            </section>

            <section className="mt-6">
              <h3 className="mb-3 text-[14px] font-black text-slate-800">难度</h3>
              <div className="grid grid-cols-5 gap-2">
                {DIFFICULTIES.map((item) => (
                  <OptionButton key={item} active={difficulty === item} onClick={() => setDifficulty(item)}>
                    {item}
                  </OptionButton>
                ))}
              </div>
            </section>

            <section className="mt-6 pb-2">
              <h3 className="mb-3 text-[14px] font-black text-slate-800">场景</h3>
              <div className="grid grid-cols-3 gap-2">
                {SCENES.map((item) => (
                  <OptionButton key={item} active={scene === item} onClick={() => setScene(item)}>
                    {item}
                  </OptionButton>
                ))}
              </div>
            </section>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 items-center justify-center rounded-2xl bg-slate-100 text-[15px] font-black text-slate-700 hover:bg-slate-200"
            >
              返回调整
            </button>
            <button
              type="button"
              onClick={() => onConfirm({ questionCount, difficulty, scene })}
              className="flex h-12 items-center justify-center rounded-2xl bg-[#7B61FF] text-[15px] font-black text-white shadow-[0_10px_24px_rgba(123,97,255,0.28)] hover:bg-[#6A52E8]"
            >
              开始练习
            </button>
          </div>
        </div>
      </Annotatable>
    </div>
  );
}
