import React, { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import scanDemoImg from '@/assets/lingjing-scan-demo.png';
import { ZhiyueRecord } from './types';

interface ZhiyueHistoryPageProps {
  records: ZhiyueRecord[];
  onBack: () => void;
  onOpenRecord: (record: ZhiyueRecord) => void;
}

export const ZhiyueHistoryPage = ({ records, onBack, onOpenRecord }: ZhiyueHistoryPageProps) => {
  const groups = useMemo(() => {
    const map = new Map<string, { dateKey: string; dateLabel: string; items: ZhiyueRecord[] }>();
    records.forEach(record => {
      const group = map.get(record.dateKey);
      if (group) {
        group.items.push(record);
        return;
      }
      map.set(record.dateKey, { dateKey: record.dateKey, dateLabel: record.dateLabel, items: [record] });
    });
    return Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  }, [records]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#ece6fb] via-[#e4eafc] to-[#dce7fb] text-slate-800">
      <header className="shrink-0 relative flex items-center justify-center px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-black text-slate-800">批改记录</h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8">
        {groups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-base font-bold text-slate-500">暂无批改记录</p>
            <p className="text-sm text-slate-400 mt-2">拍一张作业开始批改吧</p>
          </div>
        ) : (
          groups.map(group => (
            <section key={group.dateKey} className="mb-6">
              <h2 className="text-sm font-bold text-slate-500 mb-3">{group.dateLabel}</h2>
              <div className="flex flex-wrap gap-4">
                {group.items.map(record => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onOpenRecord(record)}
                    className="w-[196px] rounded-2xl overflow-hidden bg-white shadow-[0_8px_24px_rgba(90,80,160,0.12)] text-left hover:translate-y-[-2px] transition-transform"
                  >
                    <div className="relative aspect-[16/10] bg-slate-100">
                      <img src={scanDemoImg} alt="" className="w-full h-full object-cover" />
                      {record.pageCount > 1 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-bold">
                          共{record.pageCount}页
                        </span>
                      )}
                    </div>
                    <div className="bg-[#c9b6f3] px-3 py-2 flex items-center justify-between text-white text-xs font-bold">
                      <span>{record.mode === 'single' ? '单页批改' : '多页批改'}</span>
                      <span>{record.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
