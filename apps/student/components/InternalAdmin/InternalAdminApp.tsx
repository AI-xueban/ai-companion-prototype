import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Coins,
  Heart,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SquarePen,
  Upload,
  X,
} from 'lucide-react';
import {
  COIN_CONSUMPTION_BOARD,
  COIN_EARN_RULES,
  COIN_GLOBAL_RULES,
  DONATION_RECORDS,
  DONATION_RULES,
  MONTHLY_REPORTS,
  POINT_LEDGER_ROWS,
  POINT_LEDGER_TYPE_OPTIONS,
  POINT_LEDGER_TYPES,
  POOL_LEDGER_ROWS,
  POOL_LEDGER_TYPE_OPTIONS,
  POOL_LEDGER_TYPES,
  LIST_TIME_RANGE_OPTIONS,
  OUTFIT_FILTER_CATEGORIES,
  OUTFIT_FILTER_ITEM_TYPES,
  POOL_SUMMARY,
  REDEEM_ROWS,
  RISK_ROWS,
  TITLE_LEVELS,
  WISH_FILTER_CLASSES,
  WISH_FILTER_SCHOOLS,
  WISH_FILTER_TEACHERS,
  WISH_REDEEM_ROWS,
  type CoinEarnRule,
  type DonationRecord,
  type MonthlyReportRow,
  type RiskRow,
  type TitleLevelRow,
  type WishRedeemRow,
  fmtNum,
  fmtYuan,
} from '../../data/mockCharityAdminData';
import {
  closeActiveStageAndOpenNext,
  getStageAdminLabel,
  updateActiveStageCap,
  useDonationStage,
} from '../../data/charityStage';

interface InternalAdminAppProps {
  onSwitchBack: () => void;
}

type AdminMenu = '总览与风控' | '金币入账' | '商店兑换' | '捐赠与爱心池' | '捐赠规则';
type BusinessTab = '捐赠记录' | '爱心池台账' | '月报与公示';
type AccountTab = '获取规则' | '金币流水';
type RedeemSubTab = '许愿池兑换' | '装扮商城';
type FilterKey = AdminMenu | '捐池-捐赠' | '捐池-台账' | '金币-流水';

type WishPoolFilters = {
  school: string;
  className: string;
  teacher: string;
  student: string;
  status: string;
  timeRange: string;
};

const DEFAULT_WISH_FILTERS: WishPoolFilters = {
  school: '全部',
  className: '全部',
  teacher: '全部',
  student: '',
  status: '全部',
  timeRange: '全部',
};

type OutfitRedeemFilters = {
  school: string;
  className: string;
  student: string;
  itemType: string;
  outfitCategory: string;
  target: string;
  timeRange: string;
};

const DEFAULT_OUTFIT_FILTERS: OutfitRedeemFilters = {
  school: '全部',
  className: '全部',
  student: '',
  itemType: '全部',
  outfitCategory: '全部',
  target: '全部',
  timeRange: '全部',
};

const MENUS: { key: AdminMenu; icon: React.ReactNode }[] = [
  { key: '总览与风控', icon: <BarChart3 size={14} /> },
  { key: '金币入账', icon: <Coins size={14} /> },
  { key: '商店兑换', icon: <ShoppingBag size={14} /> },
  { key: '捐赠与爱心池', icon: <Heart size={14} /> },
  { key: '捐赠规则', icon: <Award size={14} /> },
];

/** 折算比为系统常量，不对学生端开放变更 */
const COINS_PER_YUAN = 100;

const MENU_LABELS: Partial<Record<AdminMenu, string>> = {
  商店兑换: '商店/许愿池兑换',
};

const getMenuLabel = (menu: AdminMenu) => MENU_LABELS[menu] ?? menu;

type ListFilters = { search: string; status: string; type: string; timeRange: string };
const DEFAULT_FILTERS: ListFilters = { search: '', status: '全部', type: '全部', timeRange: '全部' };
const PAGE_SIZE = 10;

const SCHOOL_SUMMARY_ROWS = [
  ['第一实验中学', '350', '2'],
  ['国际学校', '500', '1'],
  ['第二实验中学', '50', '1'],
] as const;

const STATUS_CLASS: Record<string, string> = {
  启用: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  已发放: 'text-blue-600 bg-blue-50 border-blue-100',
  待审核: 'text-amber-600 bg-amber-50 border-amber-100',
  已入账: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  已捐赠: 'text-rose-600 bg-rose-50 border-rose-100',
  已调整: 'text-slate-500 bg-slate-50 border-slate-100',
  待复核: 'text-amber-600 bg-amber-50 border-amber-100',
  已处理: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  误报: 'text-slate-500 bg-slate-50 border-slate-100',
  观察中: 'text-sky-600 bg-sky-50 border-sky-100',
  成功: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  失败: 'text-rose-600 bg-rose-50 border-rose-100',
  已退款: 'text-slate-500 bg-slate-50 border-slate-100',
  草稿: 'text-amber-600 bg-amber-50 border-amber-100',
  已发布: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  已下线: 'text-slate-500 bg-slate-50 border-slate-100',
  正常: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  已确认: 'text-blue-600 bg-blue-50 border-blue-100',
  停用: 'text-slate-500 bg-slate-50 border-slate-100',
  学生捐赠: 'text-rose-600 bg-rose-50 border-rose-100',
  项目支出: 'text-orange-600 bg-orange-50 border-orange-100',
  待核销: 'text-amber-600 bg-amber-50 border-amber-100',
  已完成: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  已拒绝: 'text-rose-600 bg-rose-50 border-rose-100',
  已到账: 'text-emerald-600 bg-emerald-50 border-emerald-100',
};

const TIMELINE_ROLE_CLASS: Record<string, string> = {
  学生: 'bg-blue-500',
  老师: 'bg-emerald-500',
  系统: 'bg-slate-400',
};

const CONSUMPTION_BAR_CLASS: Record<string, string> = {
  charity: 'bg-rose-400',
  wish: 'bg-amber-400',
  outfit: 'bg-violet-400',
};

const CONSUMPTION_DOT_CLASS: Record<string, string> = {
  charity: 'bg-rose-400',
  wish: 'bg-amber-400',
  outfit: 'bg-violet-400',
};

const INIT_FILTERS: Record<FilterKey, ListFilters> = {
  总览与风控: { ...DEFAULT_FILTERS },
  金币入账: { ...DEFAULT_FILTERS },
  商店兑换: { ...DEFAULT_FILTERS },
  捐赠与爱心池: { ...DEFAULT_FILTERS },
  '捐池-捐赠': { ...DEFAULT_FILTERS },
  '捐池-台账': { ...DEFAULT_FILTERS },
  '金币-流水': { ...DEFAULT_FILTERS },
  捐赠规则: { ...DEFAULT_FILTERS },
};

const Field = ({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) => (
  <label className={`space-y-1.5 block ${wide ? 'col-span-2' : ''}`}>
    <span className="text-gray-700 text-[13px]">{label}</span>
    {children}
  </label>
);

const Input = ({ placeholder = '请输入', value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) => (
  <input className="w-full h-8 border border-gray-200 rounded px-2 outline-none focus:border-blue-500 bg-white text-[13px]" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
);

const Select = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <select className="w-full h-8 border border-gray-200 rounded px-2 outline-none bg-white focus:border-blue-500 text-[13px]" value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((item) => <option key={item} value={item}>{item}</option>)}
  </select>
);

const StatCard = ({ label, value, hint, onClick, active }: {
  label: string; value: string; hint?: string; onClick?: () => void; active?: boolean;
}) => {
  const body = (
    <>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-2">{value}</p>
      {hint ? <p className="text-xs text-gray-400 mt-2">{hint}</p> : null}
      {onClick ? <p className="text-xs text-blue-600 mt-2">点击查看 ↓</p> : null}
    </>
  );
  const cls = `rounded-xl border p-4 shadow-sm text-left w-full transition-all ${
    active ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-200' : 'border-gray-100 bg-white'
  } ${onClick ? 'cursor-pointer hover:border-amber-300 hover:shadow-md' : ''}`;
  if (onClick) {
    return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  }
  return <div className={cls}>{body}</div>;
};

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="mb-3">
    <h3 className="text-sm font-medium text-gray-900">{children}</h3>
    {sub ? <p className="text-xs text-gray-500 mt-0.5">{sub}</p> : null}
  </div>
);

const Badge = ({ value }: { value: string }) => {
  const cls = STATUS_CLASS[value] ?? 'text-gray-600 bg-gray-50 border-gray-100';
  return <span className={`px-2 py-1 rounded border text-xs whitespace-nowrap ${cls}`}>{value}</span>;
};

const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
  <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-100 pb-3">
    {tabs.map((tab) => (
      <button
        key={tab}
        type="button"
        onClick={() => onChange(tab)}
        className={`h-8 px-4 rounded-t text-[13px] border-b-2 -mb-[13px] transition-colors ${active === tab ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
      >
        {tab}
      </button>
    ))}
  </div>
);

const Table = ({
  headers, rows, showCheckbox = false, selected, onToggleRow, onToggleAll,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  showCheckbox?: boolean;
  selected?: Set<number>;
  onToggleRow?: (i: number) => void;
  onToggleAll?: () => void;
}) => (
  <div className="overflow-x-auto border border-gray-100 rounded-xl">
    <table className="w-full text-[13px] text-left border-collapse min-w-[900px]">
      <thead className="bg-gray-50 text-gray-600">
        <tr className="h-10 border-b border-gray-100">
          {showCheckbox ? (
            <th className="w-10 px-3"><input type="checkbox" aria-label="全选" checked={selected?.size === rows.length && rows.length > 0} onChange={onToggleAll} /></th>
          ) : null}
          {headers.map((h) => <th key={h} className="px-3 font-medium whitespace-nowrap">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length + (showCheckbox ? 1 : 0)} className="px-3 py-10 text-center text-gray-400">暂无数据</td></tr>
        ) : rows.map((row, index) => (
          <tr key={index} className="h-[52px] border-b border-gray-100 hover:bg-blue-50/30">
            {showCheckbox ? (
              <td className="px-3"><input type="checkbox" checked={selected?.has(index)} onChange={() => onToggleRow?.(index)} aria-label={`选择第${index + 1}行`} /></td>
            ) : null}
            {row.map((cell, i) => <td key={i} className="px-3 text-gray-700 whitespace-nowrap">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pagination = ({
  total, page, pageSize, onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-3 px-1 text-[13px] text-gray-500 flex-wrap gap-2">
      <span>{total === 0 ? '共 0 条' : `第 ${rangeStart}-${rangeEnd} 条，共 ${total} 条`}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">每页 {pageSize} 条</span>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="h-8 px-2 rounded border border-gray-200 flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft size={14} /> 上一页
        </button>
        <span className="min-w-[72px] text-center">{safePage} / {totalPages}</span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="h-8 px-2 rounded border border-gray-200 flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          下一页 <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const Modal = ({ open, title, children, onClose, wide }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/35 px-4" onClick={onClose}>
      <div className={`w-full ${wide ? 'max-w-[820px]' : 'max-w-[680px]'} rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="h-12 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Drawer = ({ open, title, children, onClose, wide }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[70] flex justify-end bg-black/25" onClick={onClose}>
      <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'} h-full bg-white shadow-2xl flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="h-12 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

const matchTimeRange = (time: string, range: string) => {
  if (range === '全部') return true;
  const day = time.slice(0, 10);
  if (range === '今天') return day === '2026-06-12';
  if (range === '近7天') return day >= '2026-06-06';
  if (range === '近30天') return day >= '2026-05-13';
  return true;
};

export const InternalAdminApp: React.FC<InternalAdminAppProps> = ({ onSwitchBack }) => {
  const [activeMenu, setActiveMenu] = useState<AdminMenu>('总览与风控');
  const [businessTab, setBusinessTab] = useState<BusinessTab>('捐赠记录');
  const [accountTab, setAccountTab] = useState<AccountTab>('金币流水');
  const [redeemSubTab, setRedeemSubTab] = useState<RedeemSubTab>('许愿池兑换');
  const [wishPoolFilters, setWishPoolFilters] = useState<WishPoolFilters>(DEFAULT_WISH_FILTERS);
  const [outfitRedeemFilters, setOutfitRedeemFilters] = useState<OutfitRedeemFilters>(DEFAULT_OUTFIT_FILTERS);
  const [poolPeriod, setPoolPeriod] = useState('本月');

  const [filtersByKey, setFiltersByKey] = useState(INIT_FILTERS);
  const [toast, setToast] = useState('');
  const [riskRows, setRiskRows] = useState(RISK_ROWS);
  const [riskSelected, setRiskSelected] = useState<Set<number>>(new Set());
  const [donationRows, setDonationRows] = useState(DONATION_RECORDS);
  const [coinEarnRules, setCoinEarnRules] = useState(COIN_EARN_RULES);
  const [coinGlobalRules, setCoinGlobalRules] = useState({ ...COIN_GLOBAL_RULES });
  const [riskTypeChip, setRiskTypeChip] = useState<'全部' | RiskRow['riskType']>('全部');
  const [riskKpiFocus, setRiskKpiFocus] = useState<'pending' | 'suspicious' | 'today' | null>(null);
  const riskListRef = useRef<HTMLDivElement>(null);

  const [selectedDonation, setSelectedDonation] = useState<DonationRecord | null>(null);
  const [selectedWishRedeem, setSelectedWishRedeem] = useState<WishRedeemRow | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskRow | null>(null);
  const [editingCoinRule, setEditingCoinRule] = useState<CoinEarnRule | null>(null);
  const [titleLevels, setTitleLevels] = useState<TitleLevelRow[]>(() => [...TITLE_LEVELS]);
  const [editingTitleThreshold, setEditingTitleThreshold] = useState<TitleLevelRow | null>(null);
  const [showPointAdjust, setShowPointAdjust] = useState(false);
  const [coinAdjustUser, setCoinAdjustUser] = useState('');
  const [coinAdjustAmount, setCoinAdjustAmount] = useState('');
  const [coinAdjustReason, setCoinAdjustReason] = useState('');
  const [showReportEdit, setShowReportEdit] = useState(false);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReportRow[]>(() => [...MONTHLY_REPORTS]);
  const [previewReport, setPreviewReport] = useState<MonthlyReportRow | null>(null);
  const [reportPreviewMode, setReportPreviewMode] = useState<'view' | 'publish'>('view');
  const [lastDataRefresh, setLastDataRefresh] = useState(() => new Date());
  const [showSchoolSummary, setShowSchoolSummary] = useState(false);
  const [listPages, setListPages] = useState<Record<string, number>>({});
  const { activeStage, progress: stageProgress } = useDonationStage();
  const [showStageCapEdit, setShowStageCapEdit] = useState(false);
  const [showStageCloseConfirm, setShowStageCloseConfirm] = useState(false);
  const [stageCapDraft, setStageCapDraft] = useState('');

  const notify = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const closeReportPreview = () => {
    setPreviewReport(null);
    setReportPreviewMode('view');
  };

  const openReportPreview = (report: MonthlyReportRow, mode: 'view' | 'publish') => {
    setReportPreviewMode(mode);
    setPreviewReport(report);
  };

  const handleConfirmPublishReport = () => {
    if (!previewReport) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const publishTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setMonthlyReports((prev) =>
      prev.map((r) =>
        r.id === previewReport.id ? { ...r, status: '已发布' as const, publishTime } : r,
      ),
    );
    const nextStage = closeActiveStageAndOpenNext();
    notify(
      nextStage
        ? `「${previewReport.title}」已发布；当前募款阶段已结项，已开启新阶段（${getStageAdminLabel(nextStage)}）`
        : `「${previewReport.title}」已发布，学生端公告栏将展示本摘要`,
    );
    closeReportPreview();
  };

  const formatRefreshTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const handleManualRefresh = () => {
    setLastDataRefresh(new Date());
    notify('数据已刷新');
  };

  const handleConfirmCloseStage = () => {
    const closingLabel = activeStage ? getStageAdminLabel(activeStage) : '当前阶段';
    const nextStage = closeActiveStageAndOpenNext();
    setShowStageCloseConfirm(false);
    notify(
      nextStage
        ? `「${closingLabel}」已结项，已开启新阶段（${getStageAdminLabel(nextStage)}）`
        : '当前阶段已结项',
    );
  };

  const setListPage = (key: string, page: number) => setListPages((prev) => ({ ...prev, [key]: page }));

  const getPageSlice = <T,>(key: string, items: T[]) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const page = Math.min(listPages[key] ?? 1, totalPages);
    const offset = (page - 1) * PAGE_SIZE;
    return { page, offset, slice: items.slice(offset, offset + PAGE_SIZE) };
  };

  const renderListPagination = (key: string, total: number) => (
    <Pagination
      total={total}
      page={listPages[key] ?? 1}
      pageSize={PAGE_SIZE}
      onPageChange={(p) => setListPage(key, p)}
    />
  );

  const riskFilters = filtersByKey['总览与风控'];
  const scrollToRiskList = () => {
    window.requestAnimationFrame(() => riskListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const applyRiskKpi = (focus: 'pending' | 'suspicious' | 'today') => {
    setRiskKpiFocus(focus);
    setRiskTypeChip('全部');
    setListPage('risk', 1);
    setFiltersByKey((prev) => ({ ...prev, 总览与风控: { ...DEFAULT_FILTERS } }));
    scrollToRiskList();
  };
  const setRiskFilter = (key: keyof ListFilters, value: string) => {
    setRiskKpiFocus(null);
    setListPage('risk', 1);
    setFiltersByKey((prev) => ({ ...prev, 总览与风控: { ...prev['总览与风控'], [key]: value } }));
  };
  const resetRiskFilters = () => {
    setRiskKpiFocus(null);
    setRiskTypeChip('全部');
    setListPage('risk', 1);
    setFiltersByKey((prev) => ({ ...prev, 总览与风控: { ...DEFAULT_FILTERS } }));
  };

  const getBizFilterKey = (): FilterKey => (businessTab === '爱心池台账' ? '捐池-台账' : '捐池-捐赠');
  const bizFilters = filtersByKey[getBizFilterKey()];
  const getBizListKey = () => (businessTab === '爱心池台账' ? 'pool' : businessTab === '月报与公示' ? 'monthly' : 'donations');

  const setBizFilter = (key: keyof ListFilters, value: string) => {
    const fk = getBizFilterKey();
    setListPage(getBizListKey(), 1);
    setFiltersByKey((prev) => ({ ...prev, [fk]: { ...prev[fk], [key]: value } }));
  };
  const resetBizFilters = () => {
    const fk = getBizFilterKey();
    setListPage(getBizListKey(), 1);
    setFiltersByKey((prev) => ({ ...prev, [fk]: { ...DEFAULT_FILTERS } }));
  };

  const acctFilters = filtersByKey['金币-流水'];
  const getAcctListKey = () => (accountTab === '获取规则' ? 'coinRules' : 'points');

  const setAcctFilter = (key: keyof ListFilters, value: string) => {
    setListPage(getAcctListKey(), 1);
    setFiltersByKey((prev) => ({ ...prev, '金币-流水': { ...prev['金币-流水'], [key]: value } }));
  };
  const resetAcctFilters = () => {
    setListPage(getAcctListKey(), 1);
    setFiltersByKey((prev) => ({ ...prev, '金币-流水': { ...DEFAULT_FILTERS } }));
  };

  const filteredDonations = useMemo(() => {
    const f = filtersByKey['捐池-捐赠'];
    return donationRows.filter((r) => {
      if (f.search && !r.user.includes(f.search) && !r.id.includes(f.search)) return false;
      if (f.status === '异常待复核' && r.riskStatus !== '待复核') return false;
      else if (f.status !== '全部' && f.status !== '异常待复核' && r.status !== f.status) return false;
      if (!matchTimeRange(r.time, f.timeRange)) return false;
      return true;
    });
  }, [filtersByKey, donationRows]);

  const filteredPoolLedger = useMemo(() => {
    const f = filtersByKey['捐池-台账'];
    return POOL_LEDGER_ROWS.filter((r) => {
      if (f.search && !r.id.includes(f.search) && !r.note.includes(f.search)) return false;
      if (f.type !== '全部' && r.type !== f.type) return false;
      if (!matchTimeRange(r.time, f.timeRange)) return false;
      return true;
    });
  }, [filtersByKey]);

  const filteredPointLedger = useMemo(() => {
    const f = filtersByKey['金币-流水'];
    return POINT_LEDGER_ROWS.filter((r) => {
      if (f.search && !r.user.includes(f.search) && !r.id.includes(f.search)) return false;
      if (f.status !== '全部' && r.status !== f.status) return false;
      if (f.type !== '全部' && r.type !== f.type) return false;
      if (!matchTimeRange(r.time, f.timeRange)) return false;
      return true;
    });
  }, [filtersByKey]);

  const filteredRedeem = useMemo(() => {
    const f = outfitRedeemFilters;
    return REDEEM_ROWS.filter((r) => {
      if (f.school !== '全部' && r.school !== f.school) return false;
      if (f.className !== '全部' && r.className !== f.className) return false;
      if (f.student && !r.user.includes(f.student) && !r.item.includes(f.student)) return false;
      if (f.itemType !== '全部' && r.itemType !== f.itemType) return false;
      if (f.outfitCategory !== '全部' && r.outfitCategory !== f.outfitCategory) return false;
      if (f.target !== '全部' && r.target !== f.target) return false;
      if (!matchTimeRange(r.time, f.timeRange)) return false;
      return true;
    });
  }, [outfitRedeemFilters]);

  const filteredWishRedeem = useMemo(() => {
    const f = wishPoolFilters;
    return WISH_REDEEM_ROWS.filter((r) => {
      if (f.school !== '全部' && r.school !== f.school) return false;
      if (f.className !== '全部' && r.className !== f.className) return false;
      if (f.teacher !== '全部' && r.homeroomTeacher !== f.teacher && r.handler !== f.teacher) return false;
      if (f.student && !r.user.includes(f.student)) return false;
      if (f.status !== '全部' && r.status !== f.status) return false;
      if (!matchTimeRange(r.appliedAt, f.timeRange)) return false;
      return true;
    });
  }, [wishPoolFilters]);

  const wishClassOptions = WISH_FILTER_CLASSES[wishPoolFilters.school] ?? ['全部'];
  const outfitClassOptions = WISH_FILTER_CLASSES[outfitRedeemFilters.school] ?? ['全部'];

  const filteredRisk = useMemo(() => {
    const f = riskFilters;
    return riskRows.filter((r) => {
      if (riskKpiFocus === 'pending' && r.status !== '待复核') return false;
      if (riskKpiFocus === 'suspicious' && r.status !== '待复核' && r.status !== '观察中') return false;
      if (riskKpiFocus === 'today' && !r.time.startsWith('2026-06-12')) return false;
      if (riskTypeChip !== '全部' && r.riskType !== riskTypeChip) return false;
      if (f.search && !r.user.includes(f.search) && !r.reason.includes(f.search)) return false;
      if (f.status !== '全部' && r.status !== f.status) return false;
      return true;
    });
  }, [filtersByKey, riskRows, riskTypeChip, riskKpiFocus]);

  const openCoinAdjust = (user: string, amount: string, reason: string) => {
    setCoinAdjustUser(user);
    setCoinAdjustAmount(amount);
    setCoinAdjustReason(reason);
    setShowPointAdjust(true);
  };

  const refundDonation = (donation: DonationRecord) => {
    setDonationRows((rows) => rows.map((r) => (
      r.id === donation.id ? { ...r, status: '已退款', riskStatus: '已退款' } : r
    )));
    setSelectedDonation(null);
    notify(`已退款捐赠 ${donation.id}，金币已退回学生账户`);
  };

  const confirmDonationNormal = (donation: DonationRecord) => {
    const nextDonations = donationRows.map((r) => (
      r.id === donation.id ? { ...r, riskStatus: '已确认' as const } : r
    ));
    setDonationRows(nextDonations);
    if (donation.linkedRiskId) {
      const risk = riskRows.find((r) => r.id === donation.linkedRiskId);
      const allHandled = risk?.relatedDonationIds?.every((id) => {
        const d = nextDonations.find((x) => x.id === id);
        return d && (d.riskStatus === '已确认' || d.riskStatus === '已退款');
      });
      if (allHandled) {
        setRiskRows((rows) => rows.map((r) => (r.id === donation.linkedRiskId ? { ...r, status: '已处理' } : r)));
      }
    }
    setSelectedDonation(null);
    notify('已确认该笔捐赠正常');
  };

  const updateRiskStatus = (risk: RiskRow, status: RiskRow['status'], extra?: Partial<RiskRow>) => {
    setRiskRows((rows) => rows.map((r) => (r.id === risk.id ? { ...r, status, ...extra } : r)));
    setSelectedRisk(null);
  };

  const confirmRiskFalsePositive = (risk: RiskRow) => {
    updateRiskStatus(risk, '误报');
    notify('已确认正常，工单关闭');
  };

  const restrictRiskDonate = (risk: RiskRow) => {
    updateRiskStatus(risk, '已处理', { freezeDonate: true });
    notify('已限制该用户捐赠权限 7 天');
  };

  const refundRiskDonationsAndClose = (risk: RiskRow) => {
    const ids = new Set(risk.relatedDonationIds ?? []);
    setDonationRows((rows) => rows.map((r) => (
      ids.has(r.id) && r.status === '成功' ? { ...r, status: '已退款', riskStatus: '已退款' } : r
    )));
    updateRiskStatus(risk, '已处理', { freezeDonate: true });
    notify('关联捐赠已退款，工单已结案');
  };

  const restrictRiskEarn = (risk: RiskRow) => {
    updateRiskStatus(risk, '已处理', { freezeEarn: true });
    notify('已限制该用户金币获取 7 天');
  };

  const deductRiskCoinsAndClose = (risk: RiskRow) => {
    const amount = risk.abnormalCoins ?? 0;
    updateRiskStatus(risk, '已处理');
    notify(amount > 0 ? `已扣减 ${amount} 金币并结案` : '工单已结案');
  };

  const renderFilterBar = (
    filters: ListFilters,
    setFilter: (key: keyof ListFilters, value: string) => void,
    reset: () => void,
    config: {
      searchLabel: string;
      searchPlaceholder: string;
      statusOptions?: string[];
      statusLabel?: string;
      typeOptions?: string[];
      showStatus?: boolean;
      showTime?: boolean;
      compact?: boolean;
    },
    listKey?: string,
  ) => {
    const showStatus = config.showStatus !== false && Boolean(config.statusOptions?.length);
    const showType = Boolean(config.typeOptions?.length);
    const showTime = config.showTime !== false;
    const gridClass = config.compact
      ? 'grid-cols-2'
      : showStatus && showType && showTime
        ? 'grid-cols-4'
        : !showStatus && showType && showTime
          ? 'grid-cols-3'
          : showStatus && !showType && showTime
            ? 'grid-cols-3'
            : 'grid-cols-4';
    const actionSpanClass = config.compact
      ? 'col-span-2'
      : gridClass === 'grid-cols-3'
        ? 'col-span-3'
        : 'col-span-4';

    return (
    <div className={`grid ${gridClass} gap-x-6 gap-y-4 mb-5 text-[13px]`}>
      <Field label={config.searchLabel}><Input placeholder={config.searchPlaceholder} value={filters.search} onChange={(v) => setFilter('search', v)} /></Field>
      {showStatus ? (
        <Field label={config.statusLabel ?? '状态'}><Select options={config.statusOptions!} value={filters.status} onChange={(v) => setFilter('status', v)} /></Field>
      ) : null}
      {showType ? <Field label="类型"><Select options={config.typeOptions!} value={filters.type} onChange={(v) => setFilter('type', v)} /></Field> : null}
      {showTime ? <Field label="时间范围"><Select options={[...LIST_TIME_RANGE_OPTIONS]} value={filters.timeRange} onChange={(v) => setFilter('timeRange', v)} /></Field> : null}
      <div className={`${actionSpanClass} flex justify-end gap-2`}>
        <button type="button" onClick={reset} className="h-8 px-4 rounded border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-[13px]">重置</button>
        <button type="button" onClick={() => { if (listKey) setListPage(listKey, 1); notify('已按当前条件查询'); }} className="h-8 px-4 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1 text-[13px]"><Search size={13} /> 查询</button>
      </div>
    </div>
    );
  };

  const renderToolbar = (buttons: { label: string; primary?: boolean; onClick?: () => void; icon?: React.ReactNode }[], total: number) => (
    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        {buttons.map((btn) => (
          <button key={btn.label} type="button" onClick={btn.onClick} className={`h-8 px-3 rounded text-[13px] flex items-center gap-1 ${btn.primary ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {btn.icon}{btn.label}
          </button>
        ))}
      </div>
      <div className="text-[13px] text-gray-500">共 <b className="text-gray-900">{total}</b> 条</div>
    </div>
  );

  const navigateConsumption = (key: 'charity' | 'wish' | 'outfit') => {
    if (key === 'charity') {
      setActiveMenu('捐赠与爱心池');
      setBusinessTab('捐赠记录');
      return;
    }
    setActiveMenu('商店兑换');
    setRedeemSubTab(key === 'wish' ? '许愿池兑换' : '装扮商城');
  };

  const renderConsumptionBoard = () => {
    const total = COIN_CONSUMPTION_BOARD.modules.reduce((sum, m) => sum + m.coins, 0);
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <SectionTitle sub={`${COIN_CONSUMPTION_BOARD.period} · 金币支出结构`}>金币消耗看板</SectionTitle>
          <p className="text-[13px] text-gray-500">合计 <b className="text-gray-900">{fmtNum(total)}</b> 金币</p>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 mb-4">
          {COIN_CONSUMPTION_BOARD.modules.map((m) => {
            const pct = total > 0 ? (m.coins / total) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <button
                key={m.key}
                type="button"
                title={`${m.label} ${pct.toFixed(1)}%`}
                onClick={() => navigateConsumption(m.key)}
                className={`${CONSUMPTION_BAR_CLASS[m.key]} hover:opacity-90 transition-opacity min-w-[2px]`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COIN_CONSUMPTION_BOARD.modules.map((m) => {
            const pct = total > 0 ? ((m.coins / total) * 100).toFixed(1) : '0.0';
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => navigateConsumption(m.key)}
                className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-left hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${CONSUMPTION_DOT_CLASS[m.key]}`} />
                  <span className="text-[13px] text-gray-700">{m.label}</span>
                  <span className="text-[13px] font-semibold text-gray-900 ml-auto">{pct}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 pl-4">{fmtNum(m.coins)} 金币</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="爱心池余额" value={fmtYuan(POOL_SUMMARY.balanceYuan)} hint="当前结余" />
        <StatCard label="累计捐赠金币" value={fmtNum(POOL_SUMMARY.totalDonatedPoints)} />
        <StatCard label="平台配套资助" value={fmtYuan(POOL_SUMMARY.totalMatchYuan)} hint="通晤纪累计投入" />
        <StatCard label="今日捐赠金币" value={fmtNum(POOL_SUMMARY.todayDonatedPoints)} hint={`${POOL_SUMMARY.todayDonorCount} 人次`} />
      </div>

      {renderConsumptionBoard()}

      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 mb-4">
        <SectionTitle sub="点击数字可下钻至下方异常列表">风控中心</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="待复核"
            value={String(POOL_SUMMARY.pendingRisk)}
            active={riskKpiFocus === 'pending'}
            onClick={() => applyRiskKpi('pending')}
          />
          <StatCard
            label="可疑用户"
            value={String(POOL_SUMMARY.suspiciousUsers)}
            hint="待复核 + 观察中"
            active={riskKpiFocus === 'suspicious'}
            onClick={() => applyRiskKpi('suspicious')}
          />
          <StatCard
            label="今日新增异常"
            value="2"
            active={riskKpiFocus === 'today'}
            onClick={() => applyRiskKpi('today')}
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-amber-100/80 leading-relaxed">
          策略：单日获取异常 · 同校集中捐赠 · 捐赠频率 · 人工调整关联审查 · 平板借用制不检测多账号切换
        </p>
      </div>

      <div ref={riskListRef} className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 scroll-mt-4">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="text-sm font-medium text-gray-900">异常列表</h3>
            <p className="text-xs text-gray-500 mt-0.5">打开工单后三选一结案</p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shrink-0">
            {(['全部', '刷金币', '异常捐赠'] as const).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => { setRiskKpiFocus(null); setRiskTypeChip(chip); setListPage('risk', 1); }}
                className={`h-7 px-3 rounded-md text-[12px] transition-colors ${
                  riskTypeChip === chip ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

      {riskKpiFocus ? (
        <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          已按「{riskKpiFocus === 'pending' ? '待复核' : riskKpiFocus === 'suspicious' ? '可疑用户' : '今日新增异常'}」筛选
          <button type="button" className="ml-2 text-blue-600 hover:underline" onClick={resetRiskFilters}>清除</button>
        </p>
      ) : null}
      {renderFilterBar(riskFilters, setRiskFilter, resetRiskFilters, {
        searchLabel: '异常用户 / 原因',
        searchPlaceholder: '请输入关键词',
        statusOptions: ['全部', '待复核', '已处理', '误报', '观察中'],
        showTime: false,
        compact: true,
      }, 'risk')}
      {renderToolbar([
        { label: '导出异常', icon: <Upload size={13} />, onClick: () => notify('异常列表导出任务已创建') },
        {
          label: '批量处理', primary: true,
          onClick: () => {
            if (riskSelected.size === 0) return notify('请先勾选待处理记录');
            notify(`已批量处理 ${riskSelected.size} 条`);
            setRiskSelected(new Set());
          },
        },
      ], filteredRisk.length)}
      {(() => {
        const { offset, slice } = getPageSlice('risk', filteredRisk);
        const pageSelected = new Set([...riskSelected].filter((i) => i >= offset && i < offset + PAGE_SIZE).map((i) => i - offset));
        const pageGlobalIndices = slice.map((_, i) => offset + i);
        return (
          <>
            <Table
              showCheckbox
              selected={pageSelected}
              onToggleRow={(localI) => {
                const globalI = offset + localI;
                const n = new Set(riskSelected);
                if (n.has(globalI)) n.delete(globalI); else n.add(globalI);
                setRiskSelected(n);
              }}
              onToggleAll={() => {
                const allOnPage = pageGlobalIndices.every((i) => riskSelected.has(i));
                const n = new Set(riskSelected);
                if (allOnPage) pageGlobalIndices.forEach((i) => n.delete(i));
                else pageGlobalIndices.forEach((i) => n.add(i));
                setRiskSelected(n);
              }}
              headers={['异常用户', '学校', '风险分', '异常类型', '原因', '状态', '发现时间', '操作']}
              rows={slice.map((r) => [
                r.user, r.school, String(r.score), r.riskType, r.reason,
                <Badge key={r.id} value={r.status} />, r.time,
                <button key={`h-${r.id}`} type="button" className="text-blue-600 hover:underline" onClick={() => setSelectedRisk(r)}>处理</button>,
              ])}
            />
            {renderListPagination('risk', filteredRisk.length)}
          </>
        );
      })()}
      </div>
    </>
  );

  const renderDonations = () => (
    <>
      {renderFilterBar(bizFilters, setBizFilter, resetBizFilters, {
        searchLabel: '学生 / 捐赠编号', searchPlaceholder: '请输入学生姓名或编号', statusLabel: '捐赠结果', statusOptions: ['全部', '成功', '失败', '已退款'],
      }, 'donations')}
      {renderToolbar([
        { label: '导出', primary: true, icon: <Upload size={13} />, onClick: () => notify('捐赠记录导出任务已创建') },
        { label: '异常捐赠', icon: <ShieldCheck size={13} />, onClick: () => setBizFilter('status', '异常待复核') },
        { label: '按校汇总', icon: <BarChart3 size={13} />, onClick: () => setShowSchoolSummary(true) },
      ], filteredDonations.length)}
      {(() => {
        const { slice } = getPageSlice('donations', filteredDonations);
        return (
          <>
            <Table
              headers={['捐赠编号', '学生', '学校', '班级', '捐赠金币', '折算爱心值', '捐赠后金币余额', '触发称号', '捐赠结果', '风控审查', '捐赠时间', '操作']}
              rows={slice.map((r) => [
                r.id, r.user, r.school, r.className, String(r.points), fmtYuan(r.amountYuan), String(r.balanceAfter),
                r.triggeredTitle, <Badge key={`s-${r.id}`} value={r.status} />,
                <Badge key={`r-${r.id}`} value={r.riskStatus} />, r.time,
                <button key={`a-${r.id}`} type="button" className="text-blue-600 hover:underline" onClick={() => setSelectedDonation(r)}>
                  {r.riskStatus === '待复核' ? '处理异常' : '查看详情'}
                </button>,
              ])}
            />
            {renderListPagination('donations', filteredDonations.length)}
          </>
        );
      })()}
    </>
  );

  const renderPoolLedger = () => (
    <>
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">周期汇总 · {poolPeriod}</h3>
            <p className="text-xs text-gray-500 mt-1">学生捐赠金币汇入 + 公益项目支出</p>
          </div>
          <div className="w-32"><Select options={['本月', '上月', '自定义']} value={poolPeriod} onChange={setPoolPeriod} /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatCard label="期初余额" value={fmtYuan(25400)} />
          <StatCard label="学生捐赠汇入" value={fmtYuan(2680)} hint="学习金币折算" />
          <StatCard label="项目支出" value={fmtYuan(-3200)} />
          <StatCard label="期末余额" value={fmtYuan(POOL_SUMMARY.balanceYuan)} />
        </div>
      </div>
      {renderFilterBar(bizFilters, setBizFilter, resetBizFilters, {
        searchLabel: '编号 / 说明', searchPlaceholder: '请输入关键词',
        showStatus: false,
        typeOptions: [...POOL_LEDGER_TYPE_OPTIONS],
      }, 'pool')}
      <details className="mb-4 rounded-xl border border-gray-100 bg-gray-50/80 text-[12px] text-gray-600">
        <summary className="cursor-pointer select-none px-4 py-2.5 font-medium text-gray-700">
          筛选项说明（爱心池台账 · 共 {POOL_LEDGER_TYPES.length} 类）
        </summary>
        <div className="px-4 pb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3 font-medium w-24">筛选项</th>
                <th className="py-2 pr-3 font-medium">可选值</th>
                <th className="py-2 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-2 pr-3 font-bold text-gray-800">编号 / 说明</td>
                <td className="py-2 pr-3">文本输入</td>
                <td className="py-2">模糊匹配台账编号或说明字段</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-2 pr-3 font-bold text-gray-800">状态</td>
                <td className="py-2 pr-3 text-gray-400">— 不展示</td>
                <td className="py-2">池子级汇总无「已入池 / 已发放」状态；该维度属于学生账户流水</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-2 pr-3 font-bold text-gray-800">类型</td>
                <td className="py-2 pr-3 whitespace-nowrap">{POOL_LEDGER_TYPE_OPTIONS.join(' / ')}</td>
                <td className="py-2">
                  {POOL_LEDGER_TYPES.map((t) => (
                    <span key={t.value} className="block">
                      <b>{t.value}</b>（{t.direction}）：{t.description}
                    </span>
                  ))}
                </td>
              </tr>
              <tr className="align-top">
                <td className="py-2 pr-3 font-bold text-gray-800">时间范围</td>
                <td className="py-2 pr-3 whitespace-nowrap">{LIST_TIME_RANGE_OPTIONS.join(' / ')}</td>
                <td className="py-2">按台账发生时间筛选；「全部」表示不限时间</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      {renderToolbar([
        { label: '导出台账', primary: true, icon: <Upload size={13} />, onClick: () => notify('台账导出任务已创建') },
        { label: '查看捐赠明细', icon: <Heart size={13} />, onClick: () => setBusinessTab('捐赠记录') },
      ], filteredPoolLedger.length)}
      {(() => {
        const { slice } = getPageSlice('pool', filteredPoolLedger);
        return (
          <>
            <Table
              headers={['时间', '类型', '金额(¥)', '说明', '池子余额']}
              rows={slice.map((r) => [
                r.time,
                <Badge key={r.id} value={r.type} />,
                <span key={`a-${r.id}`} className={r.amountYuan >= 0 ? 'text-rose-600' : 'text-orange-600'}>
                  {r.amountYuan >= 0 ? `+${fmtYuan(r.amountYuan)}` : `-${fmtYuan(Math.abs(r.amountYuan))}`}
                </span>,
                r.note,
                fmtYuan(r.poolBalanceAfter),
              ])}
            />
            {renderListPagination('pool', filteredPoolLedger.length)}
          </>
        );
      })()}
      <p className="text-[12px] text-gray-400 mt-3">每笔「学生捐赠」由学生自愿捐入的学习金币自动折算；明细见「捐赠记录」Tab。</p>
    </>
  );

  const renderReports = () => (
    <>
      <SectionTitle sub="成果反馈 v1 暂不建设，待公益项目敲定后再开放">爱心月报</SectionTitle>
      {renderToolbar([{ label: '新建月报草稿', primary: true, icon: <Plus size={13} />, onClick: () => setShowReportEdit(true) }], monthlyReports.length)}
      {(() => {
        const { slice } = getPageSlice('monthly', monthlyReports);
        return (
          <>
            <Table
              headers={['月报标题', '统计周期', '状态', '发布时间', '捐赠金币', '参与人数', '操作']}
              rows={slice.map((r) => [
                r.title, r.period, <Badge key={r.id} value={r.status} />, r.publishTime, fmtNum(r.donatedPoints), fmtNum(r.participants),
                <span key={r.id} className="flex gap-2">
                  <button type="button" className="text-blue-600 hover:underline" onClick={() => setShowReportEdit(true)}>编辑</button>
                  <button type="button" className="text-blue-600 hover:underline" onClick={() => openReportPreview(r, 'view')}>预览</button>
                  {r.status === '草稿' ? <button type="button" className="text-blue-600 hover:underline" onClick={() => openReportPreview(r, 'publish')}>发布</button> : null}
                </span>,
              ])}
            />
            {renderListPagination('monthly', monthlyReports.length)}
          </>
        );
      })()}
    </>
  );

  const renderStageProgressCard = (readOnly = false) => {
    if (!activeStage || !stageProgress) return null;
    const statusTone = activeStage.status === '募集中'
      ? 'border-rose-100 bg-rose-50/40'
      : activeStage.status === '已满'
        ? 'border-amber-100 bg-amber-50/50'
        : 'border-gray-100 bg-gray-50/60';

    return (
      <div className={`rounded-2xl border p-4 mb-4 ${statusTone}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">当前募款阶段</p>
            <h3 className="text-sm font-semibold text-gray-900 mt-1">{getStageAdminLabel(activeStage)}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {activeStage.period} · <Badge value={activeStage.status} />
            </p>
          </div>
          {!readOnly && activeStage.status === '募集中' ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="h-8 px-3 rounded border border-gray-200 bg-white text-[13px] hover:bg-gray-50"
                onClick={() => {
                  setStageCapDraft(String(activeStage.capCoins));
                  setShowStageCapEdit(true);
                }}
              >
                调整上限
              </button>
              <button
                type="button"
                className="h-8 px-3 rounded border border-rose-200 bg-white text-rose-600 text-[13px] hover:bg-rose-50"
                onClick={() => setShowStageCloseConfirm(true)}
              >
                结项并开下阶段
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>已募 {fmtNum(activeStage.receivedCoins)} / {fmtNum(activeStage.capCoins)} 金币</span>
            <span>剩余 {fmtNum(stageProgress.remaining)} 金币 · {stageProgress.percent.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/80 overflow-hidden border border-gray-100">
            <div
              className={`h-full rounded-full ${stageProgress.isFull ? 'bg-amber-400' : 'bg-rose-500'}`}
              style={{ width: `${stageProgress.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {readOnly
              ? '阶段上限在「捐赠与爱心池」独立配置；此处只读展示当前进度。'
              : (activeStage.projectNote ?? '学生端捐赠将硬拦截：阶段剩余不足或已满时无法捐成。')}
          </p>
        </div>
      </div>
    );
  };

  const renderBusiness = () => (
    <>
      {renderStageProgressCard()}
      <TabBar tabs={['捐赠记录', '爱心池台账', '月报与公示']} active={businessTab} onChange={(t) => {
        const tab = t as BusinessTab;
        setBusinessTab(tab);
        setListPage(tab === '爱心池台账' ? 'pool' : tab === '月报与公示' ? 'monthly' : 'donations', 1);
      }} />
      {businessTab === '捐赠记录' && renderDonations()}
      {businessTab === '爱心池台账' && renderPoolLedger()}
      {businessTab === '月报与公示' && renderReports()}
    </>
  );

  const renderCoinEarnRules = () => (
    <div className="space-y-6">
      <div>
        <SectionTitle sub="所有场景合计上限与风控触发阈值">全局规则</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
          <Field label="每日金币总上限"><Input value={String(coinGlobalRules.dailyTotalLimit)} onChange={(v) => setCoinGlobalRules((g) => ({ ...g, dailyTotalLimit: Number(v) || 0 }))} /></Field>
          <Field label="异常获取阈值"><Input value={coinGlobalRules.earnFreezeThreshold} onChange={(v) => setCoinGlobalRules((g) => ({ ...g, earnFreezeThreshold: v }))} /></Field>
          <Field label="每日捐赠次数上限"><Input value={String(coinGlobalRules.donationDailyLimit)} onChange={(v) => setCoinGlobalRules((g) => ({ ...g, donationDailyLimit: Number(v) || 0 }))} /></Field>
          <Field label="捐赠间隔（分钟）"><Input value={String(coinGlobalRules.donationIntervalMinutes)} onChange={(v) => setCoinGlobalRules((g) => ({ ...g, donationIntervalMinutes: Number(v) || 0 }))} /></Field>
          <Field label="异常捐赠统计窗口（小时）"><Input value={String(coinGlobalRules.abnormalDonationWindowHours)} onChange={(v) => setCoinGlobalRules((g) => ({ ...g, abnormalDonationWindowHours: Number(v) || 0 }))} /></Field>
        </div>
      </div>
      <div>
        <SectionTitle sub="按学习场景配置单次与每日发放上限">场景规则</SectionTitle>
        {renderToolbar([{ label: '保存全部规则', primary: true, onClick: () => notify('金币获取规则已保存并生效') }], coinEarnRules.length)}
        {(() => {
          const { slice } = getPageSlice('coinRules', coinEarnRules);
          return (
            <>
              <Table
                headers={['场景', '单次最小', '单次最大', '每日上限', '状态', '说明', '操作']}
                rows={slice.map((r) => [
                  r.scene, String(r.minCoins), String(r.maxCoins), String(r.dailyLimit),
                  <Badge key={r.id} value={r.state} />, r.note,
                  <button key={`e-${r.id}`} type="button" className="text-blue-600 hover:underline" onClick={() => setEditingCoinRule({ ...r })}>编辑</button>,
                ])}
              />
              {renderListPagination('coinRules', coinEarnRules.length)}
            </>
          );
        })()}
      </div>
      <div>
        <SectionTitle sub="由全局规则自动推导，供风控模块引用">风控联动说明</SectionTitle>
        {(() => {
          const linkageRows = [
            ['单用户每日金币上限', `${coinGlobalRules.dailyTotalLimit} 金币`, '启用', '超出后停止发放并告警'],
            ['异常获取冻结阈值', coinGlobalRules.earnFreezeThreshold, '启用', '触发后生成刷金币待复核'],
            ['每日捐赠次数上限', `${coinGlobalRules.donationDailyLimit} 次`, '启用', '超出后标记异常捐赠'],
            ['捐赠间隔限制', `${coinGlobalRules.donationIntervalMinutes} 分钟`, '启用', '短间隔重复捐赠触发复核'],
          ];
          const { slice } = getPageSlice('ruleLinkage', linkageRows);
          return (
            <>
              <Table
                headers={['规则名称', '规则值', '状态', '说明']}
                rows={slice.map((r) => [r[0], r[1], <Badge key={r[0]} value={r[2]} />, r[3]])}
              />
              {renderListPagination('ruleLinkage', linkageRows.length)}
            </>
          );
        })()}
      </div>
    </div>
  );

  const renderAccount = () => (
    <>
      <TabBar tabs={['获取规则', '金币流水']} active={accountTab} onChange={(t) => {
        const tab = t as AccountTab;
        setAccountTab(tab);
        setListPage(tab === '获取规则' ? 'coinRules' : 'points', 1);
      }} />
      {accountTab === '获取规则' ? renderCoinEarnRules() : (
        <>
          {renderFilterBar(acctFilters, setAcctFilter, resetAcctFilters, {
            searchLabel: '流水编号 / 用户', searchPlaceholder: '请输入关键词',
            statusOptions: ['全部', '已入账', '已捐赠', '已调整', '已到账'],
            typeOptions: [...POINT_LEDGER_TYPE_OPTIONS],
          }, 'points')}
          <details className="mb-4 rounded-xl border border-gray-100 bg-gray-50/80 text-[12px] text-gray-600">
            <summary className="cursor-pointer select-none px-4 py-2.5 font-medium text-gray-700">
              流水类型说明（共 {POINT_LEDGER_TYPES.length} 类，对齐奖励结算体系 §7.3）
            </summary>
            <div className="px-4 pb-3 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-3 font-medium">类型</th>
                    <th className="py-2 pr-3 font-medium w-16">方向</th>
                    <th className="py-2 pr-3 font-medium">对应 scene</th>
                    <th className="py-2 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {POINT_LEDGER_TYPES.map((t) => (
                    <tr key={t.value} className="border-b border-gray-100 last:border-0 align-top">
                      <td className="py-2 pr-3 font-bold text-gray-800 whitespace-nowrap">{t.value}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{t.direction}</td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-gray-500">{t.scenes}</td>
                      <td className="py-2">{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-gray-400">
                v1 不含「签到奖励」发币场景；入账类合计受单用户日上限 80 金币约束。
              </p>
            </div>
          </details>
          {renderToolbar([
            { label: '新增金币调整', primary: true, icon: <Plus size={13} />, onClick: () => setShowPointAdjust(true) },
            { label: '导出流水', icon: <Upload size={13} />, onClick: () => notify('金币流水导出任务已创建') },
          ], filteredPointLedger.length)}
          {(() => {
            const { slice } = getPageSlice('points', filteredPointLedger);
            return (
              <>
                <Table
                  headers={['流水编号', '来源', '用户', '金币变动', '类型', '变动后金币余额', '状态', '时间']}
                  rows={slice.map((r) => [r.id, r.source, r.user, r.points, r.type, String(r.balanceAfter), <Badge key={r.id} value={r.status} />, r.time])}
                />
                {renderListPagination('points', filteredPointLedger.length)}
              </>
            );
          })()}
        </>
      )}
    </>
  );

  const setWishFilter = (key: keyof WishPoolFilters, value: string) => {
    setListPage('wish', 1);
    setWishPoolFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'school') next.className = '全部';
      return next;
    });
  };

  const resetWishFilters = () => {
    setListPage('wish', 1);
    setWishPoolFilters({ ...DEFAULT_WISH_FILTERS });
  };

  const renderWishPoolRedeem = () => (
    <>
      <p className="text-[13px] text-gray-500 mb-4">
        学生许愿池兑换需班主任或其他老师核销兑换，核销操作在教师管理平台完成，本页仅读取数据。
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 mb-5 text-[13px]">
        <Field label="学校"><Select options={[...WISH_FILTER_SCHOOLS]} value={wishPoolFilters.school} onChange={(v) => setWishFilter('school', v)} /></Field>
        <Field label="班级"><Select options={wishClassOptions} value={wishPoolFilters.className} onChange={(v) => setWishFilter('className', v)} /></Field>
        <Field label="老师"><Select options={[...WISH_FILTER_TEACHERS]} value={wishPoolFilters.teacher} onChange={(v) => setWishFilter('teacher', v)} /></Field>
        <Field label="学生"><Input placeholder="学生姓名" value={wishPoolFilters.student} onChange={(v) => setWishFilter('student', v)} /></Field>
        <Field label="状态"><Select options={['全部', '待核销', '已完成', '已拒绝']} value={wishPoolFilters.status} onChange={(v) => setWishFilter('status', v)} /></Field>
        <Field label="时间范围"><Select options={['全部', '今天', '近7天', '近30天']} value={wishPoolFilters.timeRange} onChange={(v) => setWishFilter('timeRange', v)} /></Field>
        <div className="col-span-2 md:col-span-3 flex justify-end gap-2">
          <button type="button" onClick={resetWishFilters} className="h-8 px-4 rounded border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-[13px]">重置</button>
          <button type="button" onClick={() => { setListPage('wish', 1); notify('已按当前条件查询'); }} className="h-8 px-4 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1 text-[13px]"><Search size={13} /> 查询</button>
        </div>
      </div>
      {renderToolbar([
        { label: '导出记录', primary: true, icon: <Upload size={13} />, onClick: () => notify('许愿池兑换记录导出任务已创建') },
      ], filteredWishRedeem.length)}
      {(() => {
        const { slice } = getPageSlice('wish', filteredWishRedeem);
        return (
          <>
            <Table
              headers={['兑换编号', '学生', '学校', '班级', '班主任', '兑换商品', '消耗金币', '状态', '申请时间', '核销人', '操作']}
              rows={slice.map((r) => [
                r.id, r.user, r.school, r.className, r.homeroomTeacher, r.item, String(r.points),
                <Badge key={`s-${r.id}`} value={r.status} />, r.appliedAt, r.handler || '—',
                <button key={`a-${r.id}`} type="button" className="text-blue-600 hover:underline" onClick={() => setSelectedWishRedeem(r)}>查看详情</button>,
              ])}
            />
            {renderListPagination('wish', filteredWishRedeem.length)}
          </>
        );
      })()}
    </>
  );

  const setOutfitFilter = (key: keyof OutfitRedeemFilters, value: string) => {
    setListPage('redeem', 1);
    setOutfitRedeemFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'school') next.className = '全部';
      return next;
    });
  };

  const resetOutfitFilters = () => {
    setListPage('redeem', 1);
    setOutfitRedeemFilters({ ...DEFAULT_OUTFIT_FILTERS });
  };

  const renderOutfitRedeem = () => (
    <>
      <p className="text-[13px] text-gray-500 mb-4">学生自主消费账单，无需教师核销</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 mb-5 text-[13px]">
        <Field label="学校"><Select options={[...WISH_FILTER_SCHOOLS]} value={outfitRedeemFilters.school} onChange={(v) => setOutfitFilter('school', v)} /></Field>
        <Field label="班级"><Select options={outfitClassOptions} value={outfitRedeemFilters.className} onChange={(v) => setOutfitFilter('className', v)} /></Field>
        <Field label="学生"><Input placeholder="学生姓名" value={outfitRedeemFilters.student} onChange={(v) => setOutfitFilter('student', v)} /></Field>
        <Field label="兑换类型"><Select options={[...OUTFIT_FILTER_ITEM_TYPES]} value={outfitRedeemFilters.itemType} onChange={(v) => setOutfitFilter('itemType', v)} /></Field>
        <Field label="装扮分类"><Select options={[...OUTFIT_FILTER_CATEGORIES]} value={outfitRedeemFilters.outfitCategory} onChange={(v) => setOutfitFilter('outfitCategory', v)} /></Field>
        <Field label="适用对象"><Select options={['全部', '我的装扮', '小晤形象']} value={outfitRedeemFilters.target} onChange={(v) => setOutfitFilter('target', v)} /></Field>
        <Field label="时间范围"><Select options={['全部', '今天', '近7天', '近30天']} value={outfitRedeemFilters.timeRange} onChange={(v) => setOutfitFilter('timeRange', v)} /></Field>
        <div className="col-span-2 md:col-span-3 flex justify-end gap-2">
          <button type="button" onClick={resetOutfitFilters} className="h-8 px-4 rounded border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-[13px]">重置</button>
          <button type="button" onClick={() => { setListPage('redeem', 1); notify('已按当前条件查询'); }} className="h-8 px-4 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1 text-[13px]"><Search size={13} /> 查询</button>
        </div>
      </div>
      {renderToolbar([
        { label: '导出记录', primary: true, icon: <Upload size={13} />, onClick: () => notify('装扮兑换记录导出任务已创建') },
      ], filteredRedeem.length)}
      {(() => {
        const { slice } = getPageSlice('redeem', filteredRedeem);
        return (
          <>
            <Table
              headers={['兑换编号', '学生', '学校', '班级', '类型', '兑换内容', '装扮分类', '适用对象', '消耗金币', '状态', '时间']}
              rows={slice.map((r) => [
                r.id, r.user, r.school, r.className, r.itemType, r.item, r.outfitCategory, r.target,
                String(r.points), <Badge key={r.id} value={r.status} />, r.time,
              ])}
            />
            {renderListPagination('redeem', filteredRedeem.length)}
          </>
        );
      })()}
    </>
  );

  const renderRedeem = () => (
    <>
      <TabBar tabs={['许愿池兑换', '装扮商城']} active={redeemSubTab} onChange={(t) => {
        const tab = t as RedeemSubTab;
        setRedeemSubTab(tab);
        setListPage(tab === '许愿池兑换' ? 'wish' : 'redeem', 1);
      }} />
      {redeemSubTab === '许愿池兑换' ? renderWishPoolRedeem() : renderOutfitRedeem()}
    </>
  );

  const renderRules = () => (
    <>
      <p className="text-[13px] text-gray-500 mb-4">
        折算比例 {DONATION_RULES.convertRatio} 为<strong className="text-gray-700 font-medium">系统常量</strong>，学生端与月报统一口径；称号门槛可直接调整，保存后立即生效。
      </p>
      {renderStageProgressCard(true)}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="金币折算比例" value={DONATION_RULES.convertRatio} hint="系统常量，不可修改" />
          <StatCard label="快捷捐赠档位" value={DONATION_RULES.quickAmounts} hint="学生端捐赠区展示" />
        </div>
        <SectionTitle sub="称号名称与证书不可改；改门槛保存后立即生效，已解锁称号不收回">称号等级</SectionTitle>
        {(() => {
          const sortedTitles = [...titleLevels].sort((a, b) => a.thresholdYuan - b.thresholdYuan);
          const { slice } = getPageSlice('titles', sortedTitles);
          return (
            <>
              <Table
                headers={['门槛(¥)', '约需金币', '称号', '证书', '图标', '启用', '操作']}
                rows={slice.map((l) => [
                  String(l.thresholdYuan),
                  fmtNum(l.thresholdYuan * COINS_PER_YUAN),
                  l.title,
                  l.certificate,
                  l.icon,
                  l.enabled ? '是' : '否',
                  <button key={l.id} type="button" className="text-blue-600 hover:underline" onClick={() => setEditingTitleThreshold({ ...l })}>改门槛</button>,
                ])}
              />
              {renderListPagination('titles', sortedTitles.length)}
            </>
          );
        })()}
      </div>
    </>
  );

  const pageTitle = activeMenu === '捐赠与爱心池'
    ? `${activeMenu} · ${businessTab}`
    : activeMenu === '金币入账'
      ? `${activeMenu} · ${accountTab}`
      : activeMenu === '商店兑换'
        ? `${getMenuLabel('商店兑换')} · ${redeemSubTab}`
        : activeMenu;

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gray-900 p-0 lg:p-8 font-sans">
      <div id="internal-admin-viewport" className="w-full h-[100dvh] lg:max-w-[1280px] lg:h-[90vh] bg-[#f5f6f8] shadow-2xl relative overflow-hidden flex lg:rounded-[12px] lg:border lg:border-gray-800">
        <aside className="w-[200px] bg-white border-r border-gray-200 shrink-0 hidden md:flex flex-col">
          <div className="h-11 px-4 flex items-center border-b border-gray-100">
            <h1 className="text-sm font-semibold text-gray-900">金币运营</h1>
          </div>
          <div className="px-3 py-3 border-b border-gray-100">
            <button type="button" onClick={onSwitchBack} className="w-full h-9 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-[13px]">返回学生端</button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 text-[13px]">
            {MENUS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveMenu(item.key)}
                className={`w-full h-10 px-4 flex items-center gap-2 text-left border-r-2 transition-colors ${activeMenu === item.key ? 'bg-blue-50 text-blue-600 border-blue-500 font-medium' : 'text-gray-700 border-transparent hover:bg-gray-50'}`}
              >
                {item.icon}
                <span className="truncate">{getMenuLabel(item.key)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="h-11 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3 text-[13px] text-gray-500">
              <Menu size={16} className="md:hidden" />
              <span>金币运营</span><span>/</span><span className="text-gray-800">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-gray-500">
              <span className="hidden sm:inline">更新于 {formatRefreshTime(lastDataRefresh)}</span>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <RefreshCw size={13} />
                <span>刷新</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-5">{pageTitle}</h2>
              {activeMenu === '总览与风控' && renderOverview()}
              {activeMenu === '金币入账' && renderAccount()}
              {activeMenu === '商店兑换' && renderRedeem()}
              {activeMenu === '捐赠与爱心池' && renderBusiness()}
              {activeMenu === '捐赠规则' && renderRules()}
            </section>
          </div>
        </main>

        {toast ? <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-lg bg-gray-900 text-white text-[13px] shadow-lg">{toast}</div> : null}

        <Drawer open={!!selectedWishRedeem} title="许愿池兑换详情" onClose={() => setSelectedWishRedeem(null)} wide>
          {selectedWishRedeem && (
            <div className="space-y-5 text-[13px]">
              <dl className="grid grid-cols-2 gap-3">
                {[['兑换编号', selectedWishRedeem.id], ['学生', selectedWishRedeem.user], ['学校', selectedWishRedeem.school], ['班级', selectedWishRedeem.className], ['班主任', selectedWishRedeem.homeroomTeacher], ['兑换商品', selectedWishRedeem.item], ['消耗金币', `${selectedWishRedeem.points} 金币`], ['状态', selectedWishRedeem.status], ['申请时间', selectedWishRedeem.appliedAt], ['处理时间', selectedWishRedeem.handledAt], ['核销人', selectedWishRedeem.handler || '—']].map(([k, v]) => (
                  <div key={k}><dt className="text-gray-500">{k}</dt><dd className="font-medium text-gray-900 mt-0.5">{k === '状态' ? <Badge value={String(v)} /> : v}</dd></div>
                ))}
              </dl>
              {selectedWishRedeem.studentNote ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <p className="text-xs text-blue-600">学生备注</p>
                  <p className="mt-1 text-gray-800">{selectedWishRedeem.studentNote}</p>
                </div>
              ) : null}
              {selectedWishRedeem.rejectReason ? (
                <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                  <p className="text-xs text-rose-600">拒绝理由</p>
                  <p className="mt-1 text-gray-800">{selectedWishRedeem.rejectReason}</p>
                </div>
              ) : null}
              {selectedWishRedeem.ledgerId ? (
                <p className="text-xs text-gray-500">关联金币流水：<span className="text-blue-600">{selectedWishRedeem.ledgerId}</span>（P1 可跳转）</p>
              ) : null}
              <div>
                <SectionTitle sub="申请、通知、核销全链路">处理记录</SectionTitle>
                <div className="space-y-0 mt-3">
                  {selectedWishRedeem.timeline.map((ev, i) => (
                    <div key={`${ev.time}-${i}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TIMELINE_ROLE_CLASS[ev.role] ?? 'bg-slate-300'}`} />
                        {i < selectedWishRedeem.timeline.length - 1 ? <div className="w-px flex-1 bg-gray-200 my-1" /> : null}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-gray-900 font-medium">{ev.actor} <span className="text-gray-400 font-normal">· {ev.action}</span></p>
                        {ev.content ? <p className="text-gray-600 mt-0.5">{ev.content}</p> : null}
                        <p className="text-xs text-gray-400 mt-1">{ev.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">内部管理仅查看，核销请至教师平台「班级激励」</p>
            </div>
          )}
        </Drawer>

        <Drawer open={!!selectedDonation} title={selectedDonation?.riskStatus === '待复核' ? '异常捐赠处理' : '捐赠详情'} onClose={() => setSelectedDonation(null)}>
          {selectedDonation && (
            <div className="space-y-4 text-[13px]">
              <dl className="space-y-3">
                {[['捐赠编号', selectedDonation.id], ['学生', selectedDonation.user], ['学校 / 班级', `${selectedDonation.school} · ${selectedDonation.className}`], ['捐赠金币', String(selectedDonation.points)], ['折算爱心值', fmtYuan(selectedDonation.amountYuan)], ['折算比例', DONATION_RULES.convertRatio], ['募款阶段', selectedDonation.stageId ?? activeStage?.id ?? '—'], ['捐赠后金币余额', String(selectedDonation.balanceAfter)], ['触发称号', selectedDonation.triggeredTitle], ['捐赠结果', selectedDonation.status], ['风控审查', selectedDonation.riskStatus], ['捐赠时间', selectedDonation.time]].map(([k, v]) => (
                  <div key={k}><dt className="text-gray-500">{k}</dt><dd className="font-medium text-gray-900 mt-0.5">{v}</dd></div>
                ))}
              </dl>
              {selectedDonation.riskReason ? (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-amber-900">
                  <p className="text-xs text-amber-600">异常原因</p>
                  <p className="mt-1">{selectedDonation.riskReason}</p>
                  {selectedDonation.linkedRiskId ? <p className="text-xs text-amber-600 mt-2">关联风控：{selectedDonation.linkedRiskId}</p> : null}
                </div>
              ) : null}
              {selectedDonation.riskStatus === '待复核' ? (
                <div className="flex flex-col gap-2 pt-2">
                  <button type="button" className="h-9 rounded bg-rose-500 text-white hover:bg-rose-600" onClick={() => refundDonation(selectedDonation)}>退款此笔捐赠</button>
                  <button type="button" className="h-9 rounded border border-gray-200 hover:bg-gray-50" onClick={() => confirmDonationNormal(selectedDonation)}>确认捐赠正常</button>
                  {selectedDonation.linkedRiskId ? (
                    <button type="button" className="h-9 rounded border border-gray-200 hover:bg-gray-50" onClick={() => {
                      const risk = riskRows.find((r) => r.id === selectedDonation.linkedRiskId);
                      if (risk) { setSelectedDonation(null); setSelectedRisk(risk); }
                    }}>查看关联风控</button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </Drawer>

        <Drawer open={!!selectedRisk} title="风控处理" onClose={() => setSelectedRisk(null)} wide>
          {selectedRisk && (
            <div className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-gray-500">用户</p><p className="font-medium">{selectedRisk.user}</p></div>
                <div><p className="text-gray-500">异常类型</p><p className="font-medium">{selectedRisk.riskType}</p></div>
                <div><p className="text-gray-500">风险分</p><p className="font-medium">{selectedRisk.score}</p></div>
                <div><p className="text-gray-500">账户金币余额</p><p className="font-medium">{selectedRisk.accountBalance ?? '—'}</p></div>
              </div>
              <p><span className="text-gray-500">原因：</span>{selectedRisk.reason}</p>

              {selectedRisk.riskType === '刷金币' && (
                <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                  <p className="text-gray-600">
                    疑似异常获取：<b>{selectedRisk.abnormalCoins ?? 0}</b> 金币
                    {(selectedRisk.abnormalCoins ?? 0) === 0 && (
                      <span className="text-amber-700 text-[11px] ml-1">（未估算扣减额，请结合流水人工判断）</span>
                    )}
                  </p>
                </div>
              )}

              {selectedRisk.riskType === '异常捐赠' && (selectedRisk.relatedDonationIds ?? []).length > 0 && (
                <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 space-y-2">
                  <p className="font-medium text-gray-900">关联捐赠</p>
                  {(selectedRisk.relatedDonationIds ?? []).map((id) => {
                    const d = donationRows.find((x) => x.id === id);
                    return d ? (
                      <div key={id} className="text-[12px] bg-white rounded border border-rose-100 px-2 py-1.5">
                        {id} · {d.points} 金币 · <Badge value={d.riskStatus} /> · {d.time}
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">处理操作（三选一）</p>
                <button
                  type="button"
                  className="h-9 rounded border border-gray-200 hover:bg-gray-50"
                  onClick={() => confirmRiskFalsePositive(selectedRisk)}
                >
                  确认正常（误报）
                </button>
                {selectedRisk.riskType === '异常捐赠' ? (
                  <>
                    <button
                      type="button"
                      className="h-9 rounded border border-gray-200 hover:bg-gray-50"
                      onClick={() => restrictRiskDonate(selectedRisk)}
                    >
                      限制捐赠 7 天
                    </button>
                    <button
                      type="button"
                      className="h-9 rounded bg-rose-500 text-white hover:bg-rose-600"
                      onClick={() => refundRiskDonationsAndClose(selectedRisk)}
                    >
                      退款并结案
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="h-9 rounded border border-gray-200 hover:bg-gray-50"
                      onClick={() => restrictRiskEarn(selectedRisk)}
                    >
                      限制获取 7 天
                    </button>
                    <button
                      type="button"
                      className="h-9 rounded bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() => deductRiskCoinsAndClose(selectedRisk)}
                    >
                      扣减并结案
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </Drawer>

        <Modal open={showPointAdjust} title="金币账户调整" onClose={() => { setShowPointAdjust(false); setCoinAdjustUser(''); setCoinAdjustAmount(''); setCoinAdjustReason(''); }}>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <Field label="调整类型"><Select options={['增加金币', '扣减金币', '人工修正']} value={coinAdjustAmount.startsWith('-') ? '扣减金币' : '增加金币'} onChange={() => {}} /></Field>
            <Field label="关联用户"><Input placeholder="学生姓名或编号" value={coinAdjustUser} onChange={setCoinAdjustUser} /></Field>
            <Field label="调整金币"><Input placeholder="例如 -360" value={coinAdjustAmount} onChange={setCoinAdjustAmount} /></Field>
            <Field label="原因说明" wide><Input placeholder="必填，如：风控扣减 RK001" value={coinAdjustReason} onChange={setCoinAdjustReason} /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => { setShowPointAdjust(false); setCoinAdjustUser(''); setCoinAdjustAmount(''); setCoinAdjustReason(''); }} className="h-8 px-4 rounded border border-gray-200">取消</button>
            <button type="button" onClick={() => {
              setShowPointAdjust(false);
              setCoinAdjustUser('');
              setCoinAdjustAmount('');
              setCoinAdjustReason('');
              notify('金币调整已保存，流水已记录');
            }} className="h-8 px-4 rounded bg-blue-500 text-white">保存</button>
          </div>
        </Modal>

        <Modal
          open={!!editingTitleThreshold}
          title={`改门槛 · ${editingTitleThreshold?.title ?? ''}`}
          onClose={() => setEditingTitleThreshold(null)}
        >
          {editingTitleThreshold && (
            <>
              <p className="text-[13px] text-gray-500 mb-4">
                门槛以累计爱心值（¥）配置；学生端展示为约 {COINS_PER_YUAN} 金币 = ¥1.00 的等效金币数。保存后立即用于新达标判定，已解锁称号不收回。
              </p>
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <Field label="门槛(¥)" wide>
                  <Input
                    value={String(editingTitleThreshold.thresholdYuan)}
                    onChange={(v) => setEditingTitleThreshold({ ...editingTitleThreshold, thresholdYuan: Number(v) || 0 })}
                  />
                </Field>
                <Field label="约需累计捐赠金币" wide>
                  <Input value={fmtNum(editingTitleThreshold.thresholdYuan * COINS_PER_YUAN)} onChange={() => {}} />
                </Field>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingTitleThreshold(null)} className="h-8 px-4 rounded border border-gray-200">取消</button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingTitleThreshold.thresholdYuan <= 0) {
                      notify('门槛须大于 0');
                      return;
                    }
                    setTitleLevels((rows) => rows.map((r) => (r.id === editingTitleThreshold.id ? editingTitleThreshold : r)));
                    setEditingTitleThreshold(null);
                    notify(`「${editingTitleThreshold.title}」门槛已更新为 ¥${editingTitleThreshold.thresholdYuan}`);
                  }}
                  className="h-8 px-4 rounded bg-blue-500 text-white"
                >
                  保存
                </button>
              </div>
            </>
          )}
        </Modal>

        <Modal open={!!editingCoinRule} title={`编辑场景规则 · ${editingCoinRule?.scene ?? ''}`} onClose={() => setEditingCoinRule(null)}>
          {editingCoinRule && (
            <>
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <Field label="场景名称"><Input value={editingCoinRule.scene} onChange={(v) => setEditingCoinRule({ ...editingCoinRule, scene: v })} /></Field>
                <Field label="状态"><Select options={['启用', '停用']} value={editingCoinRule.state} onChange={(v) => setEditingCoinRule({ ...editingCoinRule, state: v as CoinEarnRule['state'] })} /></Field>
                <Field label="单次最小金币"><Input value={String(editingCoinRule.minCoins)} onChange={(v) => setEditingCoinRule({ ...editingCoinRule, minCoins: Number(v) || 0 })} /></Field>
                <Field label="单次最大金币"><Input value={String(editingCoinRule.maxCoins)} onChange={(v) => setEditingCoinRule({ ...editingCoinRule, maxCoins: Number(v) || 0 })} /></Field>
                <Field label="每日上限" wide><Input value={String(editingCoinRule.dailyLimit)} onChange={(v) => setEditingCoinRule({ ...editingCoinRule, dailyLimit: Number(v) || 0 })} /></Field>
                <Field label="说明" wide><Input value={editingCoinRule.note} onChange={(v) => setEditingCoinRule({ ...editingCoinRule, note: v })} /></Field>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingCoinRule(null)} className="h-8 px-4 rounded border border-gray-200">取消</button>
                <button type="button" onClick={() => {
                  setCoinEarnRules((rules) => rules.map((r) => (r.id === editingCoinRule.id ? editingCoinRule : r)));
                  setEditingCoinRule(null);
                  notify(`「${editingCoinRule.scene}」规则已更新`);
                }} className="h-8 px-4 rounded bg-blue-500 text-white">保存</button>
              </div>
            </>
          )}
        </Modal>

        <Modal
          open={!!previewReport}
          title={reportPreviewMode === 'publish' ? '确认发布 · 月报预览' : '月报预览 · 学生端公告栏效果'}
          onClose={closeReportPreview}
          wide
        >
          {previewReport && (
            <div className="space-y-4 text-[13px]">
              <p className="text-gray-500">
                {reportPreviewMode === 'publish'
                  ? '请确认以下摘要将发布至学生端「爱心公告栏」。确认后状态将变为已发布。'
                  : '以下以发布后学生在「爱心公告栏」看到的摘要样式为准。'}
              </p>
              <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5">
                <p className="text-xs text-rose-400 font-medium">爱心月报</p>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">{previewReport.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{previewReport.period}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {[
                    ['捐赠金币', fmtNum(previewReport.donatedPoints)],
                    ['参与人数', fmtNum(previewReport.participants)],
                    ['平台配套', fmtYuan(previewReport.matchYuan)],
                    ['池余额', fmtYuan(previewReport.poolBalance)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-white/80 border border-rose-50 p-3">
                      <p className="text-[11px] text-gray-400">{label}</p>
                      <p className="font-semibold text-gray-900 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                {[
                  ['状态', reportPreviewMode === 'publish' ? '草稿 → 已发布' : previewReport.status],
                  ['发布时间', reportPreviewMode === 'publish' && previewReport.publishTime === '—' ? '确认发布后写入' : previewReport.publishTime],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-gray-500">{k}</dt><dd className="font-medium text-gray-900 mt-0.5">{k === '状态' && reportPreviewMode === 'view' ? <Badge value={String(v)} /> : v}</dd></div>
                ))}
              </dl>
              <div className="flex justify-end gap-2 pt-2">
                {reportPreviewMode === 'publish' ? (
                  <>
                    <button type="button" onClick={closeReportPreview} className="h-8 px-4 rounded border border-gray-200 text-gray-700">取消</button>
                    <button type="button" onClick={handleConfirmPublishReport} className="h-8 px-4 rounded bg-blue-500 text-white">确认发布</button>
                  </>
                ) : (
                  <button type="button" onClick={closeReportPreview} className="h-8 px-4 rounded border border-gray-200">关闭</button>
                )}
              </div>
            </div>
          )}
        </Modal>

        <Modal open={showReportEdit} title="编辑爱心月报" onClose={() => setShowReportEdit(false)} wide>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <Field label="月报标题"><Input value="2026年5月爱心月报" onChange={() => {}} /></Field>
            <Field label="统计周期"><Input value="2026年4月1日 — 4月30日" onChange={() => {}} /></Field>
            <Field label="捐赠金币"><Input value={fmtNum(POOL_SUMMARY.totalDonatedPoints)} onChange={() => {}} /></Field>
            <Field label="参与人数"><Input value={fmtNum(POOL_SUMMARY.participants)} onChange={() => {}} /></Field>
            <Field label="平台配套资助"><Input value={fmtYuan(POOL_SUMMARY.totalMatchYuan)} onChange={() => {}} /></Field>
            <Field label="爱心池余额"><Input value={fmtYuan(POOL_SUMMARY.balanceYuan)} onChange={() => {}} /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setShowReportEdit(false)} className="h-8 px-4 rounded border border-gray-200">取消</button>
            <button type="button" onClick={() => { setShowReportEdit(false); notify('月报草稿已保存'); }} className="h-8 px-4 rounded bg-blue-500 text-white">保存草稿</button>
          </div>
        </Modal>

        <Modal open={showSchoolSummary} title="按校汇总" onClose={() => { setShowSchoolSummary(false); setListPage('schoolSummary', 1); }}>
          {(() => {
            const rows = SCHOOL_SUMMARY_ROWS.map((r) => [...r]);
            const { slice } = getPageSlice('schoolSummary', rows);
            return (
              <>
                <Table headers={['学校', '捐赠金币', '捐赠人次']} rows={slice} />
                {renderListPagination('schoolSummary', rows.length)}
              </>
            );
          })()}
        </Modal>

        <Modal open={showStageCapEdit} title="调整募款上限" onClose={() => setShowStageCapEdit(false)}>
          <p className="text-[13px] text-gray-500 mb-4">
            当前阶段（{getStageAdminLabel(activeStage!)}）已募 {fmtNum(activeStage?.receivedCoins ?? 0)} 金币；上限不得低于已募数量。
          </p>
          <Field label="阶段金币上限">
            <Input value={stageCapDraft} onChange={setStageCapDraft} />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setShowStageCapEdit(false)} className="h-8 px-4 rounded border border-gray-200">取消</button>
            <button
              type="button"
              onClick={() => {
                const cap = Number(stageCapDraft);
                if (!Number.isFinite(cap) || cap <= 0) return notify('请输入有效上限');
                updateActiveStageCap(cap);
                setShowStageCapEdit(false);
                notify(`阶段上限已更新为 ${fmtNum(cap)} 金币`);
              }}
              className="h-8 px-4 rounded bg-blue-500 text-white"
            >
              保存
            </button>
          </div>
        </Modal>

        <Modal open={showStageCloseConfirm} title="确认结项并开启下一阶段" onClose={() => setShowStageCloseConfirm(false)}>
          {activeStage && stageProgress ? (
            <div className="space-y-4 text-[13px]">
              <p className="text-gray-600">
                确认后，当前募款阶段将<strong className="text-gray-900">立即结项</strong>，学生端将无法继续向本期捐赠；系统将自动开启一个新阶段（已募从 0 开始）。
              </p>
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-2">
                <p className="text-[11px] text-gray-400">即将结项</p>
                <p className="font-semibold text-gray-900">{getStageAdminLabel(activeStage)}</p>
                <p className="text-gray-600">
                  {activeStage.period} · 已募 {fmtNum(activeStage.receivedCoins)} / {fmtNum(activeStage.capCoins)} 金币
                  {stageProgress.remaining > 0 ? ` · 剩余 ${fmtNum(stageProgress.remaining)} 金币未募满` : ''}
                </p>
              </div>
              <ul className="space-y-1.5 text-gray-500 text-[12px]">
                <li>· 结项后本期状态变为「已结项」，历史捐赠记录保留可查。</li>
                <li>· 新阶段项目名称与周期需运营后续配置（原型默认为「项目名称：待定」）。</li>
                <li>· 发布月报时也会自动执行相同结项逻辑；请勿重复操作。</li>
              </ul>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowStageCloseConfirm(false)} className="h-8 px-4 rounded border border-gray-200 text-gray-700">
                  取消
                </button>
                <button type="button" onClick={handleConfirmCloseStage} className="h-8 px-4 rounded bg-rose-500 text-white hover:bg-rose-600">
                  确认结项
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  );
};
