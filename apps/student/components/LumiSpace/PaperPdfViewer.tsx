import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, X, Check } from 'lucide-react';
import { PAPER_CONTENT_LABELS, type PaperContentMode } from '../../services/printedFileService';

interface PaperPdfViewerProps {
    pdf: Blob;
    pages: Blob[];
    title: string;
    version: number;
    onClose: () => void;
    backLabel?: string;
    onPrint?: () => void;
    contentMode?: PaperContentMode;
    initialPrintOpen?: boolean;
}

export const PaperPdfViewer: React.FC<PaperPdfViewerProps> = ({ pages, title, onClose, backLabel = '返回', onPrint, contentMode, initialPrintOpen = false }) => {
    const [pageUrls, setPageUrls] = useState<string[]>([]);
    const [printOpen, setPrintOpen] = useState(initialPrintOpen);
    const [printComplete, setPrintComplete] = useState(false);
    const [copies, setCopies] = useState(1);
    const [pageRange, setPageRange] = useState('all');
    const [colorMode, setColorMode] = useState('color');

    useEffect(() => {
        const urls = pages.map((page) => URL.createObjectURL(page));
        setPageUrls(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [pages]);

    const contentLabel = contentMode ? PAPER_CONTENT_LABELS[contentMode] : '试卷';
    const viewport = document.getElementById('app-viewport') ?? document.body;

    return createPortal(
        <div id="paper-pdf-print-viewer" className="absolute inset-0 z-[500] flex min-h-0 flex-col overflow-hidden bg-slate-100">
            <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-5">
                <button type="button" onClick={onClose} aria-label={backLabel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200">
                    <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xs font-bold text-slate-900">{title}</h2>
                    <p className="text-[10px] text-slate-400">共 {pageUrls.length} 页</p>
                </div>
                <button type="button" disabled={!pageUrls.length} onClick={() => { setPrintComplete(false); setPrintOpen(true); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                    <Printer size={14} /> 打印
                </button>
            </header>
            <div className="paper-pdf-pages min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
                {pageUrls.map((url, index) => (
                    <img key={url} src={url} alt={`试卷第 ${index + 1} 页`} className="mx-auto mb-4 block w-full max-w-[794px] bg-white shadow-md" />
                ))}
            </div>
            {printOpen ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4">
                    <section role="dialog" aria-modal="true" aria-labelledby="paper-print-title" className="flex h-full max-h-[580px] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
                            <h3 id="paper-print-title" className="text-sm font-bold text-slate-900">打印设置</h3>
                            <button type="button" aria-label="关闭打印设置" onClick={() => setPrintOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                        </header>
                        {printComplete ? (
                            <div className="flex flex-col items-center gap-3 p-8 text-center">
                                <span className="rounded-full bg-violet-50 p-3 text-violet-600"><Check size={24} /></span>
                                <p role="status" className="text-sm font-semibold text-slate-800">打印演示已完成</p>
                                <p className="text-xs text-slate-500">{pageRange === 'all' ? pageUrls.length : 1} 页 · {copies} 份 · {colorMode === 'color' ? '彩色' : '黑白'}</p>
                                <button type="button" onClick={() => setPrintOpen(false)} className="mt-2 rounded-xl bg-violet-600 px-6 py-2 text-xs font-bold text-white">返回文档</button>
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1">
                                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4">
                                    {pageUrls.map((url, index) => pageRange === 'all' || pageRange === String(index + 1) ? <img key={url} src={url} alt={`打印预览第 ${index + 1} 页`} className={`mx-auto mb-3 w-full max-w-[420px] bg-white shadow ${colorMode === 'mono' ? 'grayscale' : ''}`} /> : null)}
                                </div>
                                <div className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto p-5">
                                    <div><p className="text-xs font-semibold text-slate-700">打印设备</p><p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">演示打印机</p></div>
                                    <label className="text-xs font-semibold text-slate-700">页面<select value={pageRange} onChange={(event) => setPageRange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-normal"><option value="all">全部页面（{pageUrls.length} 页）</option>{pageUrls.map((_, index) => <option key={index} value={index + 1}>第 {index + 1} 页</option>)}</select></label>
                                    <label className="text-xs font-semibold text-slate-700">份数<input type="number" min={1} max={99} value={copies} onChange={(event) => setCopies(Math.max(1, Math.min(99, Number(event.target.value) || 1)))} className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-xs font-normal" /></label>
                                    <label className="text-xs font-semibold text-slate-700">色彩<select value={colorMode} onChange={(event) => setColorMode(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-normal"><option value="color">彩色</option><option value="mono">黑白</option></select></label>
                                    <p className="text-[10px] leading-relaxed text-slate-400">A4 纸张 · 当前为打印流程演示</p>
                                    <div className="mt-auto flex gap-2 pt-2">
                                        <button type="button" onClick={() => setPrintOpen(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600">取消</button>
                                        <button type="button" onClick={() => { onPrint?.(); setPrintComplete(true); }} className="flex-1 rounded-lg bg-violet-600 py-2 text-xs font-bold text-white">确认打印</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            ) : null}
        </div>,
        viewport,
    );
};
