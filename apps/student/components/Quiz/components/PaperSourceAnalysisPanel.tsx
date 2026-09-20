import React, { useEffect, useState } from 'react';

import { CheckCircle2, FileText, HelpCircle, MinusCircle, Pencil, Sparkles, XCircle } from 'lucide-react';

import { getManualGradeLabel } from '../../../utils/manualGrade';

import { SELF_GRADE_OPTIONS } from './ManualGradeBlankPanel';



export type PaperSelfGrade = 'correct' | 'partial' | 'wrong';

type PaperAnalysisTab = 'answer' | 'analysis';



interface PaperSourceAnalysisPanelProps {

  draftImageUrl: string | null;

  correctAnswer: string;

  explanation: string;

  selfGrade: PaperSelfGrade | null;

  onSelfGrade: (grade: PaperSelfGrade) => void;

  onStartTutor?: () => void;

  answerTabLabel?: string;

  feedbackSlot?: React.ReactNode;

}



const GRADED_PANEL_STYLES: Record<

  PaperSelfGrade,

  { border: string; bg: string; badge: string; icon: React.ReactNode }

> = {

  correct: {

    border: 'border-emerald-200',

    bg: 'bg-emerald-50/70',

    badge: 'text-emerald-700',

    icon: <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />,

  },

  partial: {

    border: 'border-amber-200',

    bg: 'bg-amber-50/70',

    badge: 'text-amber-700',

    icon: <MinusCircle size={16} className="text-amber-600 shrink-0" />,

  },

  wrong: {

    border: 'border-rose-200',

    bg: 'bg-rose-50/70',

    badge: 'text-rose-700',

    icon: <XCircle size={16} className="text-rose-600 shrink-0" />,

  },

};



const BASE_CONTENT_TABS: { id: PaperAnalysisTab; label: string; icon: React.ReactNode }[] = [

  { id: 'answer', label: '我的作答', icon: <FileText size={14} /> },

  { id: 'analysis', label: '解析', icon: <FileText size={14} /> },

];



/** 试卷原图题提交后 · 右侧解析区（仅 q-math-013 等带 originalImageUrl 的题） */

export const PaperSourceAnalysisPanel: React.FC<PaperSourceAnalysisPanelProps> = ({

  draftImageUrl,

  correctAnswer,

  explanation,

  selfGrade,

  onSelfGrade,

  onStartTutor,

  answerTabLabel = '我的作答',

  feedbackSlot,

}) => {

  const [activeTab, setActiveTab] = useState<PaperAnalysisTab>('answer');

  const [isEditingGrade, setIsEditingGrade] = useState(!selfGrade);



  useEffect(() => {

    setIsEditingGrade(!selfGrade);

  }, [selfGrade, correctAnswer]);



  const contentTabs = BASE_CONTENT_TABS.map((tab) =>

    tab.id === 'answer' ? { ...tab, label: answerTabLabel } : tab,

  );



  const handleGrade = (grade: PaperSelfGrade) => {

    onSelfGrade(grade);

    setIsEditingGrade(false);

  };



  const renderSelfGradeBlock = () => {

    if (selfGrade && !isEditingGrade) {

      const style = GRADED_PANEL_STYLES[selfGrade];

      return (

        <div className={`rounded-xl border ${style.border} ${style.bg} px-3 py-2.5 space-y-2`}>

          <div className="flex items-center justify-between gap-2">

            <div className="flex items-center gap-2 min-w-0">

              {style.icon}

              <span className={`text-xs font-black ${style.badge}`}>

                已批改 · {getManualGradeLabel(selfGrade)}

              </span>

            </div>

            <button

              type="button"

              onClick={() => setIsEditingGrade(true)}

              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/80 transition"

            >

              <Pencil size={12} />

              修改

            </button>

          </div>

          {feedbackSlot}

        </div>

      );

    }



    return (

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 space-y-2.5">

        <div className="flex items-start gap-2">

          <HelpCircle size={14} className="text-indigo-500 shrink-0 mt-0.5" />

          <p className="text-xs text-indigo-700/90 leading-relaxed font-medium">

            {selfGrade ? '修改你的作答批改' : '请对照参考答案，自行批改你的作答情况'}

            {correctAnswer.includes('20%') && (

              <span className="block mt-1 text-indigo-600/80">第（2）问百分比需重点核对（如 20%）。</span>

            )}

          </p>

        </div>

        <div className="flex items-center gap-2">

          {SELF_GRADE_OPTIONS.map((opt) => {

            const isActive = selfGrade === opt.value;

            return (

              <button

                key={opt.value}

                type="button"

                onClick={() => handleGrade(opt.value)}

                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition ${

                  isActive ? opt.activeClass : opt.idleClass

                }`}

              >

                {opt.icon}

                {opt.label}

              </button>

            );

          })}

        </div>

        {feedbackSlot}

      </div>

    );

  };



  return (

    <div className="flex-1 flex flex-col min-h-0 w-full gap-3 overflow-hidden pb-2">

      <div className="shrink-0 flex items-center gap-2 px-0.5">

        {contentTabs.map((tab) => {

          const isActive = activeTab === tab.id;

          return (

            <button

              key={tab.id}

              type="button"

              onClick={() => setActiveTab(tab.id)}

              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-black transition-all ${

                isActive

                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm'

                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'

              }`}

            >

              {tab.icon}

              {tab.label}

            </button>

          );

        })}

        {onStartTutor && (

          <button

            type="button"

            onClick={onStartTutor}

            className="flex-[1.15] flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:brightness-105 active:scale-[0.98] transition-all"

          >

            <Sparkles size={14} />

            1对1讲题

          </button>

        )}

      </div>



      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">

        {activeTab === 'answer' && (

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 space-y-3">

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[140px] flex items-center justify-center">

              {draftImageUrl ? (

                <img

                  src={draftImageUrl}

                  alt="我的作答"

                  className="w-full h-auto max-h-[280px] object-contain"

                />

              ) : (

                <span className="text-sm text-slate-400 font-medium py-10">未检测到书写内容</span>

              )}

            </div>



            {renderSelfGradeBlock()}

          </div>

        )}



        {activeTab === 'analysis' && (

          <div className="space-y-3">

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">

              <p className="text-sm leading-relaxed">

                <span className="text-slate-400 font-bold mr-2">参考答案</span>

                <span className="font-black text-emerald-700">{correctAnswer}</span>

              </p>

            </div>



            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-2">

              <h4 className="text-sm font-black text-slate-800 shrink-0">本题解析</h4>

              <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">

                {explanation || '暂无解析'}

              </p>

              {feedbackSlot}

            </div>

          </div>

        )}

      </div>

    </div>

  );

};

