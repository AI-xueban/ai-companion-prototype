import { useEffect, useState } from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import type { DemoPrintIssue } from './printerDemoScenarios';

const printStages = {
  sending: '正在发送打印任务…',
  queued: '已发送，等待打印',
  printing: '正在打印…',
  checking: '正在查询原打印任务…',
  resuming: '正在继续打印…',
};

type PrintStage = keyof typeof printStages | 'paused';

export const PrinterDemoJob = ({ printer, totalSheets, issue, lowSupply, onComplete }: {
  printer: string;
  totalSheets: number;
  issue?: DemoPrintIssue;
  lowSupply: boolean;
  onComplete: () => void;
}) => {
  const [stage, setStage] = useState<PrintStage>('sending');
  const [printedSheets, setPrintedSheets] = useState(0);
  const printing = stage === 'printing' || stage === 'resuming';
  const sheetDelay = Math.min(850, Math.round(12000 / totalSheets));

  useEffect(() => {
    if (stage === 'paused') return;
    const timer = window.setTimeout(() => {
      if (stage === 'sending') setStage('queued');
      else if (stage === 'queued') setStage('printing');
      else if (stage === 'checking') setStage('resuming');
      else if (stage === 'printing' && issue && printedSheets === Math.floor(totalSheets / 2)) setStage('paused');
      else if (printedSheets < totalSheets) setPrintedSheets(printedSheets + 1);
      else onComplete();
    }, stage === 'printing' && lowSupply && printedSheets === 0 ? 2600 : printing ? sheetDelay : 1100);
    return () => window.clearTimeout(timer);
  }, [stage, printing, issue, lowSupply, onComplete, printedSheets, totalSheets, sheetDelay]);

  const pausedIssue = stage === 'paused' ? issue : undefined;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-slate-100 p-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div role="status">
          {pausedIssue ? <AlertTriangle size={28} className="mx-auto text-amber-600" /> : <LoaderCircle size={28} className="mx-auto animate-spin text-blue-600" />}
          <h2 className="mt-3 text-base font-semibold text-slate-900">{stage === 'paused' ? pausedIssue?.title : printStages[stage]}</h2>
          <p className="mt-1 text-xs text-slate-500">{printer}</p>
          {pausedIssue && <p className="mt-3 text-sm text-slate-600">{pausedIssue.description}</p>}
          {stage === 'printing' && lowSupply && <p className="mt-4 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">耗材偏低，当前任务继续打印。</p>}
        </div>
        {(printing || stage === 'paused' || stage === 'checking') && (
          <div className="mt-5 space-y-2 text-left">
            <div className="flex justify-between gap-3 text-xs font-medium text-slate-700">
              <span>已打印 {printedSheets} 张</span>
              <span>共 {totalSheets} 张</span>
            </div>
            <progress aria-label="打印进度" className={`block h-2 w-full ${pausedIssue ? 'accent-amber-500' : 'accent-blue-600'}`} max={totalSheets} value={printedSheets} />
          </div>
        )}
        {pausedIssue && <button type="button" onClick={() => setStage('checking')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{pausedIssue.action}</button>}
      </div>
    </div>
  );
};
