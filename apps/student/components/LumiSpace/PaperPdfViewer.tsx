import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { downloadPaperPdf } from './lumiPaperPdf';

interface PaperPdfViewerProps {
    pdf: Blob;
    pages: Blob[];
    title: string;
    version: number;
    onClose: () => void;
}

export const PaperPdfViewer: React.FC<PaperPdfViewerProps> = ({ pdf, pages, title, version, onClose }) => {
    const [pageUrls, setPageUrls] = useState<string[]>([]);

    useEffect(() => {
        const urls = pages.map((page) => URL.createObjectURL(page));
        setPageUrls(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [pages]);

    const fileName = `${title.replace(/[\\/:*?"<>|]/g, '_')}_V${version}.pdf`;

    return createPortal(
        <div id="paper-pdf-print-viewer" className="fixed inset-0 z-[500] flex flex-col bg-slate-100">
            <style>{`@media print {
                @page { size: A4; margin: 0; }
                body > :not(#paper-pdf-print-viewer) { display: none !important; }
                #paper-pdf-print-viewer { position: static !important; display: block !important; overflow: visible !important; background: white !important; }
                #paper-pdf-print-viewer header { display: none !important; }
                #paper-pdf-print-viewer .paper-pdf-pages { overflow: visible !important; padding: 0 !important; }
                #paper-pdf-print-viewer img { display: block !important; width: 210mm !important; height: 297mm !important; margin: 0 !important; box-shadow: none !important; break-after: page; }
            }`}</style>
            <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-5">
                <button type="button" onClick={onClose} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                    <ArrowLeft size={16} /> 返回聊天
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xs font-bold text-slate-900">{title}</h2>
                    <p className="text-[10px] text-slate-400">V{version} · 演示样卷 · {pageUrls.length}页</p>
                </div>
                <button type="button" onClick={() => downloadPaperPdf(pdf, fileName)} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-brand hover:bg-brand/10">
                    <Download size={14} /> 下载
                </button>
                <button type="button" onClick={() => window.print()} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                    <Printer size={14} /> 打印
                </button>
            </header>
            <div className="paper-pdf-pages min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
                {pageUrls.map((url, index) => (
                    <img key={url} src={url} alt={`试卷第 ${index + 1} 页`} className="mx-auto mb-4 block w-full max-w-[794px] bg-white shadow-md" />
                ))}
            </div>
        </div>,
        document.body,
    );
};
