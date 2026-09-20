import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, LoaderCircle, Plus } from 'lucide-react';
import type { QuestionTypeCount } from './PracticeSetupDialog';

export interface PaperPrintJob {
  title: string;
  questionCount: number;
  subject: string;
  questionTypeCounts?: QuestionTypeCount[];
  includeAnswerAnalysis?: boolean;
  printExceptionDemo?: 'paper_shortage' | 'pdf_save_failed' | 'daily_limit';
}

interface PaperPrintFlowProps {
  job: PaperPrintJob | null;
  onClose: () => void;
  onModify?: () => void;
}

type PrintStage = 'assembling' | 'saving' | 'service' | 'shortage' | 'saveFailed' | 'dailyLimit' | 'completed';
/** 打印异常也由这一处状态机驱动，避免设置页和打印页的加载状态互相卡住。 */
type ProgressPlan = 'full' | 'continue' | 'saveOnly' | 'showShortage' | 'showSaveFailed' | 'showDailyLimit' | null;

/**
 * Prototype adapter for the device print service. In the Android shell this
 * component's `service` stage maps to a PDF share/print intent; keeping the
 * job metadata here makes that handoff replaceable without touching practice
 * assembly or selection flows.
 */
export const PaperPrintFlow: React.FC<PaperPrintFlowProps> = ({ job, onClose, onModify }) => {
  const [stage, setStage] = useState<PrintStage>('assembling');
  const [progressPlan, setProgressPlan] = useState<ProgressPlan>('full');
  const [showDevices, setShowDevices] = useState(false);
  const [isPartialPaper, setIsPartialPaper] = useState(false);
  const [copies, setCopies] = useState(1);
  const [range, setRange] = useState('全部打印');
  const [orientation, setOrientation] = useState('纵向');
  const [printMode, setPrintMode] = useState('单面');
  const [colorMode, setColorMode] = useState('彩色');

  useEffect(() => {
    if (!job) return;
    // 所有任务先显示“正在组卷”；异常结果必须在校验完成后由下方 effect 统一落到对应弹窗。
    setProgressPlan(job.printExceptionDemo === 'paper_shortage' ? 'showShortage' : job.printExceptionDemo === 'pdf_save_failed' ? 'showSaveFailed' : job.printExceptionDemo === 'daily_limit' ? 'showDailyLimit' : 'full');
    setStage('assembling');
    setShowDevices(false);
    setCopies(1);
    setRange('全部打印');
    setOrientation('纵向');
    setPrintMode('单面');
    setColorMode('彩色');
    setIsPartialPaper(false);
  }, [job]);

  useEffect(() => {
    if (!job || !progressPlan) return undefined;
    const plan = progressPlan;
    if (plan === 'showShortage') {
      setStage('assembling');
      const shortageTimer = window.setTimeout(() => setStage('shortage'), 900);
      return () => window.clearTimeout(shortageTimer);
    }
    if (plan === 'showSaveFailed') {
      setStage('assembling');
      const savingTimer = window.setTimeout(() => setStage('saving'), 650);
      const failedTimer = window.setTimeout(() => setStage('saveFailed'), 1350);
      return () => {
        window.clearTimeout(savingTimer);
        window.clearTimeout(failedTimer);
      };
    }
    if (plan === 'showDailyLimit') {
      setStage('dailyLimit');
      return undefined;
    }
    setStage(plan === 'saveOnly' ? 'saving' : 'assembling');
    const saveTimer = window.setTimeout(() => setStage('saving'), plan === 'continue' ? 1100 : 850);
    const previewTimer = window.setTimeout(() => setStage('service'), plan === 'continue' ? 2050 : 1750);
    return () => {
      window.clearTimeout(saveTimer);
      window.clearTimeout(previewTimer);
    };
  }, [job, progressPlan]);

  if (!job || typeof document === 'undefined') return null;
  const viewport = document.getElementById('app-viewport') || document.body;

  if (stage === 'shortage') {
    return createPortal(
      <IssueDialog
        icon={<AlertTriangle size={28} />}
        title="可用试题不足"
        description={`当前条件下仅找到 ${Math.max(1, job.questionCount - 6)} 道符合要求的试题，少于你设置的 ${job.questionCount} 道。`}
        primaryLabel="继续组卷并打印"
        secondaryLabel="返回修改"
        onPrimary={() => { setIsPartialPaper(true); setProgressPlan('continue'); }}
        onSecondary={() => onModify?.() ?? onClose()}
      />,
      viewport,
    );
  }

  if (stage === 'saveFailed') {
    return createPortal(
      <IssueDialog
        icon={<AlertTriangle size={28} />}
        title="PDF 保存失败"
        description="本地存储空间不足或保存服务暂不可用。请重新保存成功后，再继续打印。"
        primaryLabel="重试保存"
        secondaryLabel="取消打印"
        onPrimary={() => setProgressPlan('saveOnly')}
        onSecondary={onClose}
      />,
      viewport,
    );
  }

  if (stage === 'dailyLimit') {
    return createPortal(
      <IssueDialog
        icon={<AlertTriangle size={28} />}
        title="今日组卷次数已达上限"
        description="每日最多组卷 10 次，今日 10 次机会均已用完。请明日再来组卷。"
        primaryLabel="知道了"
        onPrimary={onClose}
      />,
      viewport,
    );
  }

  if (stage === 'completed') {
    return createPortal(
      <IssueDialog
        icon={<Check size={28} />}
        title="已发送至打印机"
        description="本次打印完成后，临时保存的本地试卷 PDF 已自动删除。"
        primaryLabel="返回学习"
        onPrimary={onClose}
      />,
      viewport,
    );
  }

  if (stage !== 'service') {
    const saving = stage === 'saving';
    return createPortal(
      <div className="absolute inset-0 z-[760] flex items-center justify-center bg-slate-950/35 px-5 backdrop-blur-[2px]">
        <div className="w-full max-w-[360px] rounded-3xl bg-white px-6 py-7 text-center shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <LoaderCircle size={28} className="animate-spin" />
          </span>
          <h2 className="mt-4 text-[17px] font-semibold text-slate-900">
            {saving ? '正在保存 PDF' : '正在组卷'}
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-slate-500">
            {saving ? '正在生成并保存可打印的 PDF 文件…' : `正在为你生成 ${job.questionCount} 道${job.subject}试题…`}
          </p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-violet-50">
            <div className={`h-full rounded-full bg-violet-600 transition-all duration-500 ${saving ? 'w-[82%]' : 'w-[48%]'}`} />
          </div>
        </div>
      </div>,
      viewport,
    );
  }

  const deviceCard = (
    <div className="flex items-center rounded-[18px] bg-white px-5 py-4">
      <div>
        <p className="text-[18px] font-medium tracking-tight">EPSON AM-C5000 Series</p>
        <p className="mt-1 text-[14px] text-slate-500">空闲中</p>
      </div>
      <span aria-label="当前选中的打印机" className="ml-auto h-5 w-5 rounded-full border-[5px] border-[#2878f0]" />
    </div>
  );

  return createPortal(
    <div className="absolute inset-0 z-[760] flex flex-col bg-[#f7f7f7] text-[#171717]">
      <header className="flex h-[72px] shrink-0 items-center gap-3 px-5">
        <button type="button" aria-label={showDevices ? '返回打印助手' : '返回 AI 伴学'} onClick={showDevices ? () => setShowDevices(false) : onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-200/70">
          <ChevronLeft size={28} strokeWidth={2.4} />
        </button>
        <h1 className="text-[21px] font-semibold tracking-tight">{showDevices ? '设备' : '文档打印'}</h1>
      </header>

      {showDevices ? (
        <main className="mx-auto w-full max-w-[1300px] flex-1 overflow-y-auto px-5 pt-5">
          {deviceCard}
          <button type="button" className="mt-3 flex w-full items-center gap-3 rounded-[18px] bg-white px-5 py-[17px] text-left text-[17px] font-medium text-[#2878f0] hover:bg-blue-50">
            <Plus size={27} strokeWidth={2.2} />
            添加设备
          </button>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3">
          <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.03fr] gap-7 overflow-y-auto">
            <section className="min-w-0 overflow-hidden pt-1">
              <div className="grid h-full grid-cols-2 gap-3">
                <DocumentPreview job={job} page={1} />
                <DocumentPreview job={job} page={2} />
              </div>
            </section>
            <section className="min-w-0 space-y-3 pb-4">
              {isPartialPaper ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-700">本次按可用题量完成组卷，试卷中已标注实际题目数量。</p> : null}
              <button type="button" onClick={() => setShowDevices(true)} className="flex w-full items-center rounded-[18px] bg-white px-5 py-5 text-left hover:bg-slate-50">
                <span className="text-[19px] font-medium">打印机</span>
                <span className="ml-auto mr-3 text-[16px] text-slate-500">EPSON AM-C5000 Series</span>
                <ChevronRight size={25} className="text-slate-500" />
              </button>
              <div className="grid grid-cols-2 gap-3">
                <PrintSetting label="份数" value={String(copies)} onClick={() => setCopies((value) => value % 3 + 1)} />
                <PrintSetting label="范围" value={range} onClick={() => setRange((value) => value === '全部打印' ? '当前页' : '全部打印')} />
                <PrintSetting label="纸张方向" value={orientation} onClick={() => setOrientation((value) => value === '纵向' ? '横向' : '纵向')} />
                <PrintSetting label="纸张尺寸" value="ISO A4" />
                <PrintSetting label="打印方式" value={printMode} onClick={() => setPrintMode((value) => value === '单面' ? '双面' : '单面')} />
                <PrintSetting label="色彩模式" value={colorMode} onClick={() => setColorMode((value) => value === '彩色' ? '黑白' : '彩色')} />
                <PrintSetting label="打印质量" value="中等" />
              </div>
            </section>
          </div>
          <button type="button" onClick={() => setStage('completed')} className="mx-auto mt-4 h-[54px] w-[36%] min-w-[280px] rounded-full bg-[#2878f0] text-[18px] font-semibold text-white transition hover:bg-blue-600">
            开始打印
          </button>
        </main>
      )}
    </div>,
    viewport,
  );
};

const PrintSetting: React.FC<{ label: string; value: string; onClick?: () => void }> = ({ label, value, onClick }) => (
  <button type="button" onClick={onClick} className="flex min-h-[112px] w-full items-center rounded-[18px] bg-white px-5 text-left hover:bg-slate-50">
    <span><span className="block text-[18px] font-medium">{label}</span><span className="mt-1 block text-[15px] text-slate-500">{value}</span></span>
    <ChevronRight size={24} className="ml-auto text-slate-500" />
  </button>
);

const IssueDialog: React.FC<{ icon: React.ReactNode; title: string; description: string; primaryLabel: string; secondaryLabel?: string; onPrimary: () => void; onSecondary?: () => void }> = ({ icon, title, description, primaryLabel, secondaryLabel, onPrimary, onSecondary }) => (
  <div className="absolute inset-0 z-[780] flex items-center justify-center bg-slate-950/35 px-5 backdrop-blur-[2px]">
    <div role="dialog" aria-modal="true" className="w-full max-w-[400px] rounded-3xl bg-white px-7 py-7 text-center shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">{icon}</span>
      <h2 className="mt-4 text-[19px] font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-[14px] leading-6 text-slate-500">{description}</p>
      <button type="button" onClick={onPrimary} className="mt-6 h-12 w-full rounded-2xl bg-[#2878f0] text-[15px] font-semibold text-white hover:bg-blue-600">{primaryLabel}</button>
      {secondaryLabel ? <button type="button" onClick={onSecondary} className="mt-2 h-11 w-full rounded-2xl text-[14px] font-medium text-slate-600 hover:bg-slate-100">{secondaryLabel}</button> : null}
    </div>
  </div>
);


const DocumentPreview: React.FC<{ job: PaperPrintJob; page: number }> = ({ job, page }) => (
  <div className="flex min-w-0 flex-col">
    <div className="relative min-h-[360px] flex-1 overflow-hidden bg-white px-[9%] py-[11%] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <p className="text-center text-[10px] font-semibold">{job.subject}练习卷</p>
      <p className="mt-4 text-[7px] font-semibold">{page === 1 ? '一、选择题（共 5 小题）' : '二、填空题与解答题'}</p>
      {Array.from({ length: page === 1 ? 11 : 9 }, (_, index) => (
        <p key={index} className="mt-2 text-[6px] leading-[1.35] text-slate-700">{index + 1}. {page === 1 ? `根据题意选择正确答案（共 ${job.questionCount} 题）` : '请写出解题过程，并在横线处填写答案'}　　_____</p>
      ))}
      <p className="absolute bottom-5 left-0 right-0 text-center text-[7px] text-slate-500">第 {page} 页</p>
      <span className="absolute bottom-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#2878f0] text-white"><Check size={17} strokeWidth={3} /></span>
    </div>
    <p className="py-4 text-center text-[15px] text-slate-500">{page}/10</p>
  </div>
);
