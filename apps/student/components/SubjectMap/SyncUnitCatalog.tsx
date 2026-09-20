import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SyncUnitCatalogItem {
  id: string;
  title: string;
}

interface SyncUnitCatalogProps {
  items: SyncUnitCatalogItem[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export const SyncUnitCatalog: React.FC<SyncUnitCatalogProps> = ({ items, activeId, onSelect }) => (
  <aside className="flex w-52 shrink-0 flex-col border-r border-slate-100 bg-[#F7F8FB]">
    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto py-3">
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => onSelect(item.id)}
            className={`relative py-2.5 pl-3.5 pr-8 text-left text-[13px] leading-5 transition ${
              selected
                ? 'z-10 ml-2.5 w-[calc(100%-10px)] rounded-l-xl border border-r-0 border-indigo-100 bg-white font-semibold text-indigo-600'
                : 'mx-2.5 w-[calc(100%-20px)] rounded-xl font-medium text-slate-500 hover:bg-white/80 hover:text-slate-800'
            }`}
          >
            {selected && (
              <span className="absolute left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full bg-indigo-500" />
            )}
            <span className="line-clamp-2">{item.title}</span>
            {selected && (
              <ChevronRight size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400" />
            )}
          </button>
        );
      })}
    </div>
  </aside>
);

export const SyncUnitDetailHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex shrink-0 items-center gap-2.5 border-b border-indigo-100 bg-white px-6 py-3">
    <span className="h-[18px] w-[3px] rounded-full bg-indigo-500" />
    <p className="min-w-0 truncate text-[15px] font-semibold text-indigo-600">{title}</p>
  </div>
);
