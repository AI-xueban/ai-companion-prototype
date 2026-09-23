import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppWindow, ArrowLeft, ChevronRight, Download, Grid2X2, RefreshCw, X } from 'lucide-react';
import type { ThirdPartyApp } from '../../data/thirdPartyApps';

interface ThirdPartyAppRailProps {
  isOpen: boolean;
  apps: ThirdPartyApp[];
  onToggle: () => void;
  onClose: () => void;
  onOpenApp: (app: ThirdPartyApp) => void;
}

type AppAction = 'install' | 'update' | 'open';
type Transfer = { progress: number; paused: boolean; action: 'install' | 'update' };

function getAppAction(app: ThirdPartyApp): AppAction {
  if (!app.installed) return 'install';
  if (app.enabled !== false && app.latestVersion && app.installedVersion !== app.latestVersion) return 'update';
  return 'open';
}

function actionLabel(action: AppAction) { return action === 'install' ? '安装' : '更新'; }

export function ThirdPartyAppRail({ isOpen, apps, onToggle, onClose, onOpenApp }: ThirdPartyAppRailProps) {
  const [isMorePageOpen, setIsMorePageOpen] = React.useState(false);
  const [localApps, setLocalApps] = React.useState(apps);
  const [transfers, setTransfers] = React.useState<Record<string, Transfer>>({});
  React.useEffect(() => { const timer = window.setInterval(() => { setTransfers((current) => { const next = { ...current }; Object.entries(next).forEach(([id, transfer]) => { if (transfer.paused) return; const progress = Math.min(100, transfer.progress + 5); if (progress >= 100) { const item = localApps.find((app) => app.id === id); if (item) setLocalApps((apps) => apps.map((app) => app.id === id ? { ...app, installed: true, installedVersion: app.latestVersion } : app)); delete next[id]; } else next[id] = { ...transfer, progress }; }); return next; }); }, 700); return () => window.clearInterval(timer); }, [localApps]);
  const visibleApps = localApps.filter((app) => app.enabled !== false || app.installed);
  const installedApps = visibleApps.filter((app) => getAppAction(app) === 'open');
  const updateApps = visibleApps.filter((app) => getAppAction(app) === 'update');
  const uninstalledApps = visibleApps.filter((app) => getAppAction(app) === 'install');
  const orderedApps = [...installedApps, ...updateApps, ...uninstalledApps];
  const handleClose = () => { setIsMorePageOpen(false); onClose(); };

  const startTransfer = (app: ThirdPartyApp) => { const action = getAppAction(app); if (action === 'open') return onOpenApp(app); setTransfers((current) => ({ ...current, [app.id]: { progress: 0, paused: false, action } })); };
  const toggleTransfer = (app: ThirdPartyApp) => setTransfers((current) => current[app.id] ? { ...current, [app.id]: { ...current[app.id], paused: !current[app.id].paused } } : current);
  const cancelTransfer = (app: ThirdPartyApp) => setTransfers((current) => { const next = { ...current }; delete next[app.id]; return next; });

  const renderAppCard = (app: ThirdPartyApp, full = false) => {
    const action = getAppAction(app);
    const transfer = transfers[app.id];
    const openable = Boolean(app.installed) && !transfer;
    return (
      <div key={app.id} role={openable || transfer ? 'button' : undefined} tabIndex={openable || transfer ? 0 : undefined} onClick={() => transfer ? toggleTransfer(app) : (openable ? onOpenApp(app) : undefined)} onKeyDown={(event) => { if ((openable || transfer) && (event.key === 'Enter' || event.key === ' ')) transfer ? toggleTransfer(app) : onOpenApp(app); }} className={`${full ? 'min-h-[138px] px-2 py-3' : 'min-h-[104px] px-1.5 py-2'} flex flex-col items-center justify-center rounded-2xl border border-indigo-100/80 bg-white/90 shadow-[0_4px_14px_rgba(55,65,120,0.06)] ${openable || transfer ? 'cursor-pointer transition-all hover:border-indigo-200 hover:bg-white' : ''}`}>
        <span className={`${full ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'} flex items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-300 to-violet-500 font-black text-white shadow-[0_5px_12px_rgba(99,102,241,0.23)]`}>{app.icon || app.name.slice(0, 1)}</span>
        <span className="mt-1.5 text-[12px] font-bold text-slate-700">{app.name}</span>
        {transfer ? <><div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${transfer.progress}%` }} /></div><span className="mt-1 text-[9px] text-slate-400">{transfer.paused ? '已暂停，点击继续' : `${transfer.action === 'install' ? '安装' : '更新'}中 ${transfer.progress}%`}</span><button type="button" onClick={(event) => { event.stopPropagation(); cancelTransfer(app); }} className="mt-1 text-[9px] text-slate-400 hover:text-red-500">取消</button></> : action !== 'open' && <button type="button" onClick={(event) => { event.stopPropagation(); startTransfer(app); }} className="mt-1 flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 hover:bg-slate-100"><span>{action === 'install' ? <Download size={10} /> : <RefreshCw size={10} />}</span>{actionLabel(action)}</button>}
      </div>
    );
  };
  const renderSection = (title: string, sectionApps: ThirdPartyApp[]) => (
    <section className="mb-6 last:mb-0"><div className="mb-3 flex items-center gap-2"><span className="h-4 w-1 rounded-full bg-indigo-500" /><h3 className="text-sm font-black text-slate-700">{title}</h3><span className="text-[11px] font-bold text-slate-400">{sectionApps.length}</span></div>{sectionApps.length ? <div className="grid grid-cols-3 gap-3 md:grid-cols-5">{sectionApps.map((app) => renderAppCard(app, true))}</div> : <div className="rounded-xl border border-dashed border-indigo-100 bg-white/50 py-5 text-center text-xs text-slate-400">暂无应用</div>}</section>
  );

  return (
    <>
      <button type="button" aria-label={isOpen ? '收起更多应用' : '打开更多应用'} aria-expanded={isOpen} onClick={onToggle} className={`absolute left-0 top-[80%] z-[700] flex h-14 w-[112px] -translate-y-1/2 items-center justify-center gap-2 rounded-r-2xl px-2 border border-l-0 border-white/70 bg-white/90 text-indigo-500 shadow-[4px_8px_24px_rgba(48,56,102,0.18)] backdrop-blur-xl transition-all hover:w-10 ${isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'}`}><Grid2X2 size={18} /><span className="text-xs font-bold">更多应用</span></button>
      <AnimatePresence>
        {isOpen && !isMorePageOpen && (
          <>
            <motion.button type="button" aria-label="关闭更多应用" onClick={handleClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[800] bg-black/50" />
            <motion.aside aria-label="更多应用" initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="absolute left-0 top-0 bottom-0 z-[810] flex w-[min(320px,84vw)] flex-col overflow-hidden rounded-r-[28px] border border-l-0 border-white/80 bg-[#f8f8ff]/95 shadow-[16px_0_44px_rgba(48,56,102,0.2)] backdrop-blur-2xl">
              <RailHeader onClose={handleClose} />
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3"><div className="grid grid-cols-3 gap-2">{orderedApps.slice(0, 9).map((app) => renderAppCard(app))}</div></div>
              <button type="button" onClick={() => setIsMorePageOpen(true)} className="mx-3 mb-4 flex items-center justify-center gap-1.5 rounded-2xl border border-indigo-100 bg-white/90 py-2.5 text-xs font-bold text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50"><Grid2X2 size={15} />全部<ChevronRight size={14} /></button>
            </motion.aside>
          </>
        )}
        {isMorePageOpen && (
          <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} className="absolute inset-0 z-[820] flex flex-col overflow-hidden bg-[#f8f8ff] text-slate-800">
            <div className="flex items-center justify-between border-b border-indigo-100 bg-white/90 px-5 pb-3 pt-5 backdrop-blur-xl"><button type="button" onClick={() => setIsMorePageOpen(false)} className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-bold text-indigo-600 hover:bg-indigo-50"><ArrowLeft size={18} />返回</button><p className="text-base font-black">更多应用</p><span className="w-8" aria-hidden="true" /></div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{renderSection('已安装', installedApps)}{renderSection('待更新', updateApps)}{renderSection('未安装', uninstalledApps)}</div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function RailHeader({ onClose }: { onClose: () => void }) {
  return <div className="flex items-center justify-between border-b border-indigo-100/80 px-4 pb-3 pt-5"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-500"><AppWindow size={18} /></span><p className="text-[15px] font-black text-slate-800">更多应用</p></div><button type="button" aria-label="关闭更多应用" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-indigo-50 hover:text-slate-700"><X size={17} /></button></div>;
}






