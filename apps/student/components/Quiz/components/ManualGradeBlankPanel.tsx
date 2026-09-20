import React, { useEffect, useState } from 'react';
import { CheckCircle2, HelpCircle, MinusCircle, Pencil, XCircle } from 'lucide-react';
import { PaperSelfGrade } from './PaperSourceAnalysisPanel';
import { getManualGradeLabel } from '../../../utils/manualGrade';

export const SELF_GRADE_OPTIONS: {
  value: PaperSelfGrade;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    value: 'correct',
    label: '正确',
    icon: <CheckCircle2 size={16} />,
    activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-sm',
    idleClass: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  {
    value: 'partial',
    label: '半对',
    icon: <MinusCircle size={16} />,
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-sm',
    idleClass: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  {
    value: 'wrong',
    label: '错误',
    icon: <XCircle size={16} />,
    activeClass: 'bg-rose-500 text-white border-rose-500 shadow-sm',
    idleClass: 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50',
  },
];

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

interface ManualGradeBlankPanelProps {
  blankLabel: string;
  userText?: string;
  correctText?: string;
  /** 学科网公式/图片参考答案 */
  referenceImageUrl?: string | null;
  selfGrade: PaperSelfGrade | null;
  onSelfGrade: (grade: PaperSelfGrade) => void;
}

/** 多空填空题中，某一空需学生自行批改（如百分数写法） */
export const ManualGradeBlankPanel: React.FC<ManualGradeBlankPanelProps> = ({
  blankLabel,
  userText,
  correctText,
  referenceImageUrl,
  selfGrade,
  onSelfGrade,
}) => {
  const [isEditing, setIsEditing] = useState(!selfGrade);

  useEffect(() => {
    setIsEditing(!selfGrade);
  }, [blankLabel, selfGrade]);

  const handleGrade = (grade: PaperSelfGrade) => {
    onSelfGrade(grade);
    setIsEditing(false);
  };

  const activeOption = SELF_GRADE_OPTIONS.find((o) => o.value === selfGrade);

  if (selfGrade && !isEditing) {
    const style = GRADED_PANEL_STYLES[selfGrade];
    return (
      <div className={`rounded-xl border ${style.border} ${style.bg} p-3 space-y-2`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {style.icon}
            <span className={`text-xs font-black ${style.badge}`}>
              {blankLabel} · {getManualGradeLabel(selfGrade)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/80 transition"
          >
            <Pencil size={12} />
            修改
          </button>
        </div>
        {userText && (
          <p className="text-xs font-bold text-slate-600 pl-6">你的填写：{userText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-black text-indigo-800">
          {blankLabel} · {selfGrade ? '修改批改' : '需手动批改'}
        </span>
        {userText && <span className="text-xs font-bold text-slate-600">你的填写：{userText}</span>}
      </div>
      {(referenceImageUrl || correctText) && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500">参考答案</span>
          {referenceImageUrl ? (
            <img src={referenceImageUrl} alt={correctText ?? '参考答案'} className="h-6 w-auto object-contain" />
          ) : (
            <span className="text-sm font-black text-emerald-700">{correctText}</span>
          )}
          {referenceImageUrl && correctText && (
            <span className="text-xs text-slate-400">（{correctText}）</span>
          )}
        </div>
      )}
      <div className="flex items-start gap-2">
        <HelpCircle size={14} className="text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700/90 leading-relaxed font-medium">
          请对照参考答案（{correctText ?? '—'}），批改该空作答
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
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-bold transition ${
                isActive ? opt.activeClass : opt.idleClass
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
      {selfGrade && activeOption && (
        <p className="text-[11px] text-slate-500 text-center">
          当前标记为「{activeOption.label}」，选择后将更新结果
        </p>
      )}
    </div>
  );
};
