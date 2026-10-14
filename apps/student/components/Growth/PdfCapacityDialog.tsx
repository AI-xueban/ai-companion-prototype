import React from 'react';

interface PdfCapacityDialogProps {
  message: string;
  onClose: () => void;
  onGoToFiles: () => void;
  onRetry?: () => void;
}

export const PdfCapacityDialog: React.FC<PdfCapacityDialogProps> = ({ message, onClose, onGoToFiles, onRetry }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onKeyDown={(event) => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') {
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="pdf-capacity-title" aria-describedby="pdf-capacity-reason" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h2 id="pdf-capacity-title" className="text-lg font-bold text-slate-900">存储空间不足，保存失败</h2>
      <p id="pdf-capacity-reason" className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">请前往“我的文件”删除不再需要的文件，释放空间后重试。</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" autoFocus onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">取消</button>
        {onRetry ? <button type="button" onClick={onRetry} className="rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">重试</button> : null}
        <button type="button" onClick={onGoToFiles} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">前往我的文件</button>
      </div>
    </section>
  </div>
);
