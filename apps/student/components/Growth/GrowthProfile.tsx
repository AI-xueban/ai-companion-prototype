
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as motionOriginal, AnimatePresence } from 'framer-motion';
import { UserProfileData } from '../../types';
import { getUserGrowthData } from '../../services/geminiService';
import { ArrowLeft, ShoppingBag, Lock, Settings, Coins, Heart, BadgeCheck, Scroll, X, PiggyBank, Sparkles, BookOpen } from 'lucide-react';
import { MyTextbooksPage } from './MyTextbooksPage';
import { isJuniorGrade, type UiSchoolSystem } from '../../data/juniorDemoCatalog';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';
import { UserAvatarImage } from '../User/UserAvatarImage';
import { WardrobeModal } from '../Store/WardrobeModal';
import { applyStageDonation, getStageStudentLabel, isCharityCampaignRunning, useDonationStage, validateStageDonation } from '../../data/charityStage';

const motion = motionOriginal as any;

const AchievementBadgeCard: React.FC<{
  unlocked: boolean;
  icon: string;
  title: string;
  subtitle: string;
  badgeBg: string;
  interactive?: boolean;
  onActivate?: () => void;
}> = ({ unlocked, icon, title, subtitle, badgeBg, interactive, onActivate }) => {
  const canActivate = Boolean(interactive && unlocked && onActivate);
  return (
    <div
      role={canActivate ? 'button' : undefined}
      tabIndex={canActivate ? 0 : undefined}
      onClick={canActivate ? onActivate : undefined}
      onKeyDown={canActivate ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate?.();
        }
      } : undefined}
      className={`min-h-0 min-w-0 h-full overflow-hidden px-2 py-2 rounded-[20px] flex flex-col items-center justify-center text-center gap-[min(0.4rem,5cqh)] transition-all relative border ${
        unlocked
          ? `${canActivate ? 'cursor-pointer active:scale-95 ' : ''}bg-white border-gray-100`
          : 'bg-[#EEF1F6] border-transparent'
      }`}
      style={{ containerType: 'size' }}
    >
      <div
        className="rounded-full flex items-center justify-center relative mx-auto shrink"
        style={{
          width: 'min(3rem, 36cqmin)',
          height: 'min(3rem, 36cqmin)',
          fontSize: 'min(1.375rem, 18cqmin)',
          backgroundColor: unlocked ? badgeBg : '#E2E8F0',
        }}
      >
        {unlocked ? (
          <span className="leading-none">{icon}</span>
        ) : (
          <>
            <span className="opacity-25 grayscale leading-none">{icon}</span>
            <span className="absolute bottom-0 right-0 w-[34%] h-[34%] min-w-[10px] min-h-[10px] max-w-4 max-h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <Lock size={8} className="text-gray-500" />
            </span>
          </>
        )}
      </div>
      <div className="min-h-0 min-w-0 w-full overflow-hidden">
        <h4 className={`font-bold leading-tight truncate ${unlocked ? 'text-gray-800' : 'text-gray-500'}`} style={{ fontSize: 'clamp(9px, 8cqmin, 12px)' }}>{title}</h4>
        <p className={`font-medium leading-tight truncate mt-[2px] ${unlocked ? 'text-gray-500' : 'text-gray-400'}`} style={{ fontSize: 'clamp(8px, 7cqmin, 11px)' }}>
          {subtitle}
        </p>
      </div>
      {unlocked && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full" />}
    </div>
  );
};

interface GrowthProfileProps {
  onStartAssessment?: () => void;
  onOpenStore?: () => void;
  onViewReport?: () => void; // New Prop
  onOpenSettings?: () => void; // New Prop
  coins?: number;
  openCharitySignal?: number;
  onCharityOpenChange?: (isOpen: boolean) => void;
  userGrade?: string;
  textbookTerm?: string;
  schoolSystem?: UiSchoolSystem;
  onGradeChange?: (grade: string) => void;
  onTextbookTermChange?: (term: string) => void;
  onSchoolSystemChange?: (system: UiSchoolSystem) => void;
  onTextbooksOpenChange?: (isOpen: boolean) => void;
  onTextbookVersionChange?: () => void;
  /** 勋章实际点亮状态由领取成功事件驱动；演示场景可覆写初始数据。 */
  achievementUnlockOverrides?: Record<string, boolean>;
}

export const GrowthProfile: React.FC<GrowthProfileProps> = ({
  onStartAssessment,
  onOpenStore,
  onViewReport,
  onOpenSettings,
  coins,
  openCharitySignal = 0,
  onCharityOpenChange,
  userGrade = '七年级',
  textbookTerm = '上册',
  schoolSystem = '六三制',
  onGradeChange,
  onTextbookTermChange,
  onSchoolSystemChange,
  onTextbooksOpenChange,
  onTextbookVersionChange,
  achievementUnlockOverrides = {},
}) => {
  const [data, setData] = useState<UserProfileData | null>(null);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [isCharityOpen, setIsCharityOpen] = useState(false);
  const [isTextbooksOpen, setIsTextbooksOpen] = useState(false);
  const [charityViewState, setCharityViewState] = useState<'OVERVIEW' | 'RECORDS' | 'CERTIFICATE'>('OVERVIEW');
  const [charityInput, setCharityInput] = useState(100);
  const [charityJustDonated, setCharityJustDonated] = useState(false);
  const [charityStageHint, setCharityStageHint] = useState('');
  const { activeStage: charityStage, progress: charityStageProgress } = useDonationStage();
  const isCharityRunning = isCharityCampaignRunning(charityStage);

  useEffect(() => {
    if (openCharitySignal > 0) {
      setCharityViewState('OVERVIEW');
      setIsCharityOpen(true);
    }
  }, [openCharitySignal]);

  useEffect(() => {
    onCharityOpenChange?.(isCharityOpen);
    return () => onCharityOpenChange?.(false);
  }, [isCharityOpen, onCharityOpenChange]);

  useEffect(() => {
    onTextbooksOpenChange?.(isTextbooksOpen);
    return () => onTextbooksOpenChange?.(false);
  }, [isTextbooksOpen, onTextbooksOpenChange]);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    getUserGrowthData().then(setData);
    setPortalTarget(
        document.getElementById('app-viewport') ||
        document.getElementById('modal-root') ||
        null
    );
  }, []);

  if (!data) return <div className="p-8 text-center text-gray-400">加载档案...</div>;
  
  const isPreL1 = data.level < 1;
  
  // Use passed prop coins if available, else fallback to fetched data
  const currentCoins = coins !== undefined ? coins : data.coins;

  const handleCharityDonate = () => {
    const stageCheck = validateStageDonation(charityInput);
    if (!stageCheck.ok) {
      setCharityStageHint(stageCheck.message ?? '当前无法捐赠');
      return;
    }
    if (charityInput > currentCoins) {
      setCharityStageHint('金币不足，去完成任务');
      return;
    }
    if (!applyStageDonation(charityInput)) {
      setCharityStageHint('捐赠未成功，请稍后重试');
      return;
    }
    setCharityStageHint('');
    setCharityJustDonated(true);
    setCharityViewState('CERTIFICATE');
  };

  const charityRecords = [
    { date: '2026-06-03 19:42', points: 300, amount: 3 },
    { date: '2026-06-05 20:18', points: 100, amount: 1 },
    { date: '2026-06-09 18:06', points: charityInput, amount: charityInput / 100 },
  ];
  const totalCharityAmount = charityRecords.reduce((sum, record) => sum + record.amount, 0);
  const charityLevels = [
    { threshold: 1, title: '爱心小星星', certificate: '爱心参与证', icon: '✨', tone: 'from-amber-300 to-orange-400', badgeBg: '#FFE08A' },
    { threshold: 10, title: '爱心小天使', certificate: '爱心守护证', icon: '💗', tone: 'from-rose-300 to-pink-500', badgeBg: '#FFB3D0' },
    { threshold: 50, title: '爱心小大使', certificate: '爱心大使证', icon: '🌟', tone: 'from-fuchsia-400 to-purple-500', badgeBg: '#E0C4FF' },
    { threshold: 100, title: '爱心守护官', certificate: '爱心守护官证', icon: '🛡️', tone: 'from-sky-400 to-indigo-500', badgeBg: '#B8D4FF' },
    { threshold: 300, title: '公益小领航员', certificate: '公益领航证', icon: '🚀', tone: 'from-emerald-400 to-teal-500', badgeBg: '#A8EBC8' },
  ];
  const achievementBadgeBgs = ['#EDE7FF', '#FFF4C8', '#D9F0FF', '#FFE4F0'];
  const unlockedCharityLevels = charityLevels.filter(level => totalCharityAmount >= level.threshold);
  const currentCharityLevel = unlockedCharityLevels[unlockedCharityLevels.length - 1] || charityLevels[0];
  const nextCharityLevel = charityLevels.find(level => totalCharityAmount < level.threshold);
  const totalCharityPoints = charityRecords.reduce((sum, record) => sum + record.points, 0);
  const isAchievementUnlocked = (achievement: UserProfileData['achievements'][number]) => (
    Object.prototype.hasOwnProperty.call(achievementUnlockOverrides, achievement.id)
      ? achievementUnlockOverrides[achievement.id]
      : achievement.unlocked
  );

  const displayTextbookTerm = textbookTerm === '上册'
    ? '上学期'
    : textbookTerm === '下册'
      ? '下学期'
      : textbookTerm;
  const textbooksSummary = `${userGrade} · ${displayTextbookTerm}`;

  if (isTextbooksOpen) {
    return (
      <MyTextbooksPage
        grade={userGrade}
        term={textbookTerm}
        schoolSystem={schoolSystem}
        onGradeChange={(grade) => onGradeChange?.(grade)}
        onTermChange={(term) => onTextbookTermChange?.(term)}
        onSchoolSystemChange={(system) => onSchoolSystemChange?.(system)}
        onVersionChange={onTextbookVersionChange}
        onBack={() => setIsTextbooksOpen(false)}
      />
    );
  }

  if (isCharityOpen) {
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar bg-[#FFF7FA]">
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 px-6 pt-8 pb-8 text-white rounded-b-[44px] shadow-[0_20px_60px_-20px_rgba(244,63,94,0.55)]">
          <motion.div animate={{ y: [0, -16, 0], x: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <button onClick={() => setIsCharityOpen(false)} aria-label="返回" className="mb-5 w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center active:scale-95 transition-transform">
              <ArrowLeft size={20} />
            </button>
            <p className="text-[10px] font-black tracking-[0.3em] text-rose-100">公益爱心大使</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <h2 className="text-3xl font-black">我的爱心公益</h2>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${isCharityRunning ? 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30' : 'bg-white/15 text-white/70 border-white/25'}`}>
                {isCharityRunning ? '进行中' : '已结束'}
              </span>
            </div>
            <p className="text-sm text-white/80 mt-2 font-bold">记录每一次小小参与，和更多同学的心意一起汇入爱心池。</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-6 pb-32 flex flex-col gap-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {[
              { key: 'OVERVIEW', label: '总览', icon: Heart },
              { key: 'RECORDS', label: '记录', icon: Scroll },
              { key: 'CERTIFICATE', label: '证书', icon: BadgeCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const active = charityViewState === tab.key;
              return (
                <motion.button key={tab.key} whileTap={{ scale: 0.95 }} onClick={() => setCharityViewState(tab.key as any)} className={`shrink-0 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 border transition-all ${active ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-white text-gray-500 border-rose-100'}`}>
                  <Icon size={14} /> {tab.label}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {charityViewState === 'OVERVIEW' && (
              <motion.div key="overview-page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
                <div className="rounded-[32px] p-5 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 text-white shadow-[0_20px_50px_-16px_rgba(244,63,94,0.55)] relative overflow-hidden">
                  <motion.div animate={{ y: [0, -12, 0], x: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-white/20 blur-3xl" />
                  <div className="relative z-10">
                    <p className="text-[10px] text-rose-50/80 font-black tracking-[0.24em]">捐赠爱心金币</p>
                    <h3 className="text-2xl font-black mt-2">把学习金币汇入爱心池</h3>
                    <p className="text-xs text-white/75 font-bold mt-2">小小金币汇入爱心池，一起把善意慢慢传出去。</p>
                    {charityStage && charityStageProgress ? (
                      <div className="mt-4 rounded-2xl bg-white/15 border border-white/20 p-3">
                        <div className="flex justify-between text-[10px] text-white/80 font-bold mb-2">
                          <span>{getStageStudentLabel(charityStage)}</span>
                          <span>{charityStageProgress.isFull ? '已满' : `剩余 ${charityStageProgress.remaining.toLocaleString()} 金币`}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                          <div className={`h-full rounded-full ${charityStageProgress.isFull ? 'bg-amber-300' : 'bg-white'}`} style={{ width: `${charityStageProgress.percent}%` }} />
                        </div>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-4 gap-2 mt-5">
                      {[50, 100, 200, 500].map(amount => {
                        const overBalance = amount > currentCoins;
                        const overStage = charityStageProgress ? amount > charityStageProgress.remaining : false;
                        const disabled = overBalance || overStage || charityStageProgress?.isFull;
                        return (
                          <motion.button
                            key={amount}
                            whileTap={!disabled ? { scale: 0.92 } : undefined}
                            disabled={disabled}
                            onClick={() => { setCharityInput(amount); setCharityStageHint(''); }}
                            className={`h-11 rounded-2xl text-xs font-black border transition-all ${charityInput === amount && !disabled ? 'bg-white text-rose-600 border-white shadow-lg' : disabled ? 'bg-white/10 text-white/35 border-white/10 grayscale' : 'bg-white/15 text-white border-white/20'}`}
                          >
                            {amount}
                          </motion.button>
                        );
                      })}
                    </div>
                    <motion.button
                      whileTap={!charityStageProgress?.isFull && charityInput <= currentCoins ? { scale: 0.96 } : undefined}
                      disabled={charityStageProgress?.isFull || charityInput > currentCoins || (charityStageProgress ? charityInput > charityStageProgress.remaining : false)}
                      onClick={handleCharityDonate}
                      className={`mt-4 w-full py-3.5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 ${charityStageProgress?.isFull ? 'bg-white/20 text-white/45' : charityInput <= currentCoins ? 'bg-white text-rose-600' : 'bg-white/20 text-white/45'}`}
                    >
                      <Heart size={16} fill="currentColor" /> {charityStageProgress?.isFull ? '本阶段已满，感谢参与' : charityInput <= currentCoins ? '一键点亮爱心' : '金币不足，去完成任务'}
                    </motion.button>
                    {charityStageHint ? <p className="text-[10px] text-amber-100 text-center mt-2 font-bold">{charityStageHint}</p> : null}
                  </div>
                </div>

                <div className="rounded-[32px] p-6 bg-white border border-rose-100 shadow-[0_18px_50px_-18px_rgba(244,63,94,0.3)] relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-rose-100"><Heart size={100} fill="currentColor" /></div>
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-rose-500 font-black tracking-[0.22em]">我的累计参与</p>
                      <h3 className="text-2xl font-black text-gray-900 mt-2">{currentCharityLevel.title}</h3>
                      <p className="text-xs text-gray-400 font-bold mt-1">当前爱心身份 · {currentCharityLevel.certificate}</p>
                    </div>
                    <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${currentCharityLevel.tone} flex items-center justify-center text-4xl shadow-xl`}>
                      {currentCharityLevel.icon}
                    </div>
                  </div>
                  <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
                    <div className="rounded-2xl bg-rose-50 p-3 border border-rose-100"><p className="text-[10px] text-rose-400 font-black">累计捐赠金币</p><p className="text-xl font-black text-gray-900 mt-1">{totalCharityPoints}</p></div>
                    <div className="rounded-2xl bg-rose-50 p-3 border border-rose-100"><p className="text-[10px] text-rose-400 font-black">累计折算金额</p><p className="text-xl font-black text-gray-900 mt-1">¥{totalCharityAmount.toFixed(2)}</p></div>
                    <div className="rounded-2xl bg-rose-50 p-3 border border-rose-100"><p className="text-[10px] text-rose-400 font-black">已获称号</p><p className="text-xl font-black text-gray-900 mt-1">{unlockedCharityLevels.length}</p></div>
                  </div>
                  {nextCharityLevel && (
                    <div className="relative z-10 mt-5 rounded-3xl bg-gray-50 border border-gray-100 p-4">
                      <div className="flex justify-between text-xs font-black text-gray-500 mb-2"><span>距离「{nextCharityLevel.title}」</span><span>还差 ¥{Math.max(0, nextCharityLevel.threshold - totalCharityAmount).toFixed(2)}</span></div>
                      <div className="h-3 rounded-full bg-white overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full" style={{ width: `${Math.min(100, (totalCharityAmount / nextCharityLevel.threshold) * 100)}%` }} /></div>
                    </div>
                  )}
                </div>

                <div className="rounded-[32px] p-5 bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-black text-gray-900">我的爱心称号</h3><button onClick={() => setCharityViewState('CERTIFICATE')} className="text-xs font-black text-rose-500">查看证书</button></div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {charityLevels.map(level => {
                      const unlocked = totalCharityAmount >= level.threshold;
                      return <div key={level.title} className={`shrink-0 w-28 rounded-2xl p-3 text-center border ${unlocked ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100 opacity-50 grayscale'}`}><div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${level.tone} flex items-center justify-center text-2xl mb-2`}>{unlocked ? level.icon : <Lock size={18} />}</div><p className="text-xs font-black text-gray-800">{level.title}</p><p className="text-[10px] text-gray-400 mt-1">¥{level.threshold}</p></div>;
                    })}
                  </div>
                </div>

                <div className="rounded-[32px] p-5 bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-black text-gray-900">爱心池总览</h3><PiggyBank size={20} className="text-rose-400" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gray-50 p-3"><p className="text-[10px] text-gray-400 font-black">累计捐赠金币</p><p className="font-black text-lg text-gray-900">128,800</p></div>
                    <div className="rounded-2xl bg-gray-50 p-3"><p className="text-[10px] text-gray-400 font-black">参与人数</p><p className="font-black text-lg text-gray-900">3,642</p></div>
                    <div className="rounded-2xl bg-gray-50 p-3"><p className="text-[10px] text-gray-400 font-black">企业配捐</p><p className="font-black text-lg text-gray-900">¥12,880</p></div>
                    <div className="rounded-2xl bg-gray-50 p-3"><p className="text-[10px] text-gray-400 font-black">爱心池余额</p><p className="font-black text-lg text-gray-900">¥28,600</p></div>
                  </div>
                </div>
              </motion.div>
            )}

            {charityViewState === 'RECORDS' && (
              <motion.div key="records-page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-3">
                {charityRecords.map((record, index) => <div key={`${record.date}-${index}`} className="rounded-[24px] p-4 bg-white border border-rose-100 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] text-gray-400 font-bold mb-1">捐赠时间</p><p className="font-black text-gray-900">{record.date}</p></div><div className="text-right"><p className="text-[10px] text-gray-400 font-bold mb-1">折算金额</p><p className="font-black text-rose-500">¥{record.amount.toFixed(2)}</p></div></div><div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between"><span className="text-xs text-gray-400 font-bold">捐赠金币</span><span className="text-lg font-black text-gray-900">{record.points} 金币</span></div></div>)}
              </motion.div>
            )}

            {charityViewState === 'CERTIFICATE' && (
              <motion.div key="cert-page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
                {charityLevels.map(level => {
                  const unlocked = totalCharityAmount >= level.threshold;
                  return <div key={level.title} className={`rounded-[28px] p-5 border ${unlocked ? 'bg-white border-rose-100 shadow-lg' : 'bg-white/70 border-gray-100 opacity-60 grayscale'}`}><div className="flex items-center gap-4"><div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${level.tone} flex items-center justify-center text-3xl`}>{unlocked ? level.icon : <Lock size={20} />}</div><div className="flex-1"><p className={`text-[10px] font-black tracking-[0.18em] ${unlocked ? 'text-rose-500' : 'text-gray-400'}`}>{unlocked ? '已获得证书' : `累计 ¥${level.threshold} 解锁`}</p><h4 className="font-black text-xl text-gray-900 mt-1">{level.certificate}</h4><p className="text-xs text-gray-500 mt-1">{level.title}</p></div>{unlocked && <BadgeCheck size={22} className="text-rose-500" />}</div></div>;
                })}
                <p className="text-center text-[10px] text-gray-400 font-bold leading-relaxed px-4">爱心身份只记录持续参与，不代表爱心大小。每一份小小心意都值得被认真记录。</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#F5F7FA]">
       
       {/* 身份 + 爱心公益 + 金币商店：紫色铺满顶部，三块同一行 */}
       <div className="relative shrink-0 bg-[#6C5DD3] pt-3 pb-4 px-5 rounded-b-[28px]">
            <div className="flex items-center justify-end gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setIsTextbooksOpen(true)}
                    className="flex h-8 max-w-[220px] items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 text-white backdrop-blur-md shadow-sm transition-colors hover:bg-white/20"
                >
                    <BookOpen size={14} strokeWidth={2.3} className="shrink-0" />
                    <span className="text-[11px] font-black">我的课本</span>
                    <span className="min-w-0 truncate text-[10px] font-bold text-white/70">{textbooksSummary}</span>
                </button>
                <button 
                    type="button"
                    onClick={onOpenSettings}
                    aria-label="打开控制中心"
                    className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-md shadow-sm border border-white/10"
                >
                    <Settings size={16} />
                </button>
            </div>
            <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-stretch">
                <div className="relative min-h-[120px] flex items-center gap-4 text-white">
                    <button
                        type="button"
                        onClick={() => setIsWardrobeOpen(true)}
                        aria-label="打开衣橱"
                        className="shrink-0 active:scale-95 transition-transform"
                    >
                        <UserAvatarImage 
                            size="sm" 
                            variant="half"
                            className="w-[68px] h-[68px]" 
                            showShadow={false}
                            imageSrc="/girl_v0.1-removebg-preview.png"
                        />
                    </button>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="text-xl font-black tracking-tight drop-shadow-sm truncate">{data.name}</h1>
                            <div className={`shrink-0 font-black text-[10px] px-2 py-0.5 rounded-md border ${
                                isPreL1
                                    ? 'bg-white/15 text-white/50 border-white/20'
                                    : 'bg-gradient-to-r from-accent to-yellow-300 text-brand-dark shadow-md shadow-yellow-400/20 border-white/20'
                            }`}>
                                Lv.{data.level}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-100">
                            <span>{isPreL1 ? '成长等级' : '累计成长'}</span>
                            <span className="text-white/90 font-mono">{data.currentXp}/{data.nextLevelXp} XP</span>
                        </div>
                        <div className="h-2 bg-black/20 rounded-full overflow-hidden ring-1 ring-white/10 backdrop-blur-sm shadow-inner">
                            <div 
                                className={`h-full relative ${isPreL1 ? 'bg-white/25' : 'bg-gradient-to-r from-accent to-yellow-300 shadow-[0_0_15px_rgba(255,206,81,0.5)]'}`}
                                style={{ width: `${isPreL1 ? 0 : (data.currentXp / data.nextLevelXp) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-white/30 w-full h-full" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,0.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0.15) 75%,transparent 75%,transparent)', backgroundSize: '10px 10px'}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        setCharityViewState('OVERVIEW');
                        setIsCharityOpen(true);
                    }}
                    className={`relative overflow-hidden rounded-[26px] p-4 min-h-[120px] text-left active:scale-98 transition-transform ${
                      isCharityRunning
                        ? 'bg-[#FF5B7A] text-white shadow-[0_16px_34px_-18px_rgba(255,91,122,0.45)]'
                        : 'bg-slate-500 text-white shadow-[0_16px_34px_-18px_rgba(100,116,139,0.45)]'
                    }`}
                >
                    {isCharityRunning ? (
                      <motion.div
                        animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/20 blur-2xl"
                      />
                    ) : null}
                    <Heart size={64} fill="currentColor" className="absolute -right-3 bottom-0 text-white/12" />
                    <div className="relative z-10 flex flex-col h-full justify-between gap-3 min-h-[88px]">
                        <div className="flex items-center justify-between">
                            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-lg ${isCharityRunning ? 'bg-white/20 border-white/20' : 'bg-white/10 border-white/15'}`}>
                                <Heart size={22} fill="currentColor" className={isCharityRunning ? '' : 'opacity-70'} />
                            </div>
                            <span className={`px-2 py-1 rounded-full border text-[10px] font-black ${isCharityRunning ? 'bg-white/20 border-white/20 text-white' : 'bg-white/10 border-white/15 text-white/75'}`}>
                              {isCharityRunning ? '进行中' : '已结束'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-black text-base leading-tight">爱心公益</h3>
                            <p className="text-[10px] text-white/78 font-bold mt-1 leading-relaxed">
                              {isCharityRunning ? '金币汇入爱心池' : '本期募款已结束，仍可查看记录'}
                            </p>
                        </div>
                    </div>
                </motion.button>

                <button 
                    onClick={onOpenStore}
                    className="relative overflow-hidden rounded-[26px] p-4 min-h-[120px] bg-white border border-white shadow-[0_14px_32px_-18px_rgba(0,0,0,0.25)] text-left active:scale-98 transition-all hover:border-brand/20"
                >
                    <Coins size={64} className="absolute -right-3 bottom-0 text-yellow-200/60" fill="currentColor" />
                    <div className="relative z-10 flex flex-col h-full justify-between gap-3 min-h-[88px]">
                        <div className="flex items-center justify-between">
                            <div className="w-11 h-11 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center text-yellow-500 shadow-inner">
                                <ShoppingBag size={22} strokeWidth={2.4} />
                            </div>
                            <span className="px-2 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black">去兑换</span>
                        </div>
                        <div>
                            <h3 className="font-black text-base text-gray-800 leading-tight">金币商店</h3>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 leading-relaxed">余额 <span className="text-accent-dark font-black">{currentCoins}</span> 金币</p>
                        </div>
                    </div>
                </button>
            </div>
       </div>

       <div className="flex-1 min-h-0 px-6 pt-4 pb-[92px] flex flex-col">
            <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                <h3 className="font-black text-gray-800 flex items-center gap-2 text-base">
                    <span className="w-1.5 h-4 bg-gradient-to-b from-accent to-yellow-400 rounded-full"></span>
                    成就墙
                </h3>
                <div className="bg-gray-100/80 px-3 py-1 rounded-full text-[11px] font-bold text-gray-400 border border-white/50">
                    {data.achievements.filter(isAchievementUnlocked).length + unlockedCharityLevels.length}/{data.achievements.length + charityLevels.length} 点亮
                </div>
            </div>
            
            <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-2 gap-3 overflow-hidden">
                {data.achievements.map((ach, index) => (
                    <AchievementBadgeCard
                        key={ach.id}
                        unlocked={isAchievementUnlocked(ach)}
                        icon={ach.icon}
                        title={ach.title}
                        subtitle={isAchievementUnlocked(ach) ? ach.description : '尚未点亮'}
                        badgeBg={achievementBadgeBgs[index % achievementBadgeBgs.length]}
                    />
                ))}
                {charityLevels.map((level) => {
                    const unlocked = totalCharityAmount >= level.threshold;
                    return (
                        <AchievementBadgeCard
                            key={level.title}
                            unlocked={unlocked}
                            icon={level.icon}
                            title={level.title}
                            subtitle={unlocked ? level.certificate : `¥${level.threshold} 解锁`}
                            badgeBg={level.badgeBg}
                            interactive
                            onActivate={() => {
                                setIsCharityOpen(true);
                                setCharityViewState('CERTIFICATE');
                            }}
                        />
                    );
                })}
            </div>
       </div>

       <AnimatePresence>
           {isCharityOpen && (
               <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="fixed inset-0 z-[260] bg-black/55 backdrop-blur-sm flex items-end justify-center"
               >
                   <motion.div
                       initial={{ y: 90, scale: 0.96 }}
                       animate={{ y: 0, scale: 1 }}
                       exit={{ y: 90, scale: 0.96 }}
                       transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                       className="w-full max-w-4xl h-[90%] rounded-t-[40px] bg-slate-950 border border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col relative"
                   >
                       <div className="absolute inset-0 pointer-events-none overflow-hidden">
                           <motion.div animate={{ y: [0, -18, 0], x: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-rose-500/20 blur-3xl" />
                           <motion.div animate={{ y: [0, 22, 0], x: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-24 right-0 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl" />
                       </div>

                       <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 relative z-10">
                           <div>
                               <p className="text-[10px] uppercase tracking-[0.3em] text-rose-300 font-black">公益爱心大使</p>
                               <h2 className="text-lg font-black text-white mt-1">我的爱心公益</h2>
                           </div>
                           <button onClick={() => setIsCharityOpen(false)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-transform">
                               <X size={18} />
                           </button>
                       </div>

                       <div className="flex items-center gap-2 px-4 md:px-6 py-3 overflow-x-auto no-scrollbar bg-white/5 border-b border-white/5 relative z-10">
                           {[
                               { key: 'OVERVIEW', label: '总览', icon: Heart },
                               { key: 'RECORDS', label: '记录', icon: Scroll },
                               { key: 'CERTIFICATE', label: '证书', icon: BadgeCheck },
                           ].map(tab => {
                               const Icon = tab.icon;
                               const active = charityViewState === tab.key;
                               return (
                                   <motion.button key={tab.key} whileTap={{ scale: 0.95 }} onClick={() => setCharityViewState(tab.key as any)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border transition-all ${active ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>
                                       <Icon size={13} /> {tab.label}
                                   </motion.button>
                               );
                           })}
                       </div>

                       <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-slate-950 relative z-10">
                           <AnimatePresence mode="wait">
                               {charityViewState === 'OVERVIEW' && (
                                   <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="rounded-[28px] p-5 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden">
                                           <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="absolute -right-8 -top-8 w-28 h-28 rounded-full border border-white/10" />
                                           <p className="text-[10px] uppercase tracking-[0.25em] font-black text-rose-100">学习金币兑爱心</p>
                                           <h3 className="text-2xl font-black mt-2">公益爱心大使</h3>
                                           <p className="text-rose-50/90 text-sm leading-relaxed mt-3">学习即行善，学生自愿将学习金币转化为爱心助学基金，参与公益也能收获荣誉。</p>
                                           {charityStage && charityStageProgress ? (
                                               <div className="mt-4 rounded-2xl bg-white/10 border border-white/15 p-3 backdrop-blur-sm">
                                                   <div className="flex justify-between text-[10px] text-rose-100/90 font-bold mb-2">
                                                       <span>{getStageStudentLabel(charityStage)}</span>
                                                       <span>{charityStageProgress.isFull ? '已满' : `剩余 ${charityStageProgress.remaining.toLocaleString()} 金币`}</span>
                                                   </div>
                                                   <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                                                       <div className={`h-full rounded-full ${charityStageProgress.isFull ? 'bg-amber-300' : 'bg-white'}`} style={{ width: `${charityStageProgress.percent}%` }} />
                                                   </div>
                                               </div>
                                           ) : null}
                                           <div className="grid grid-cols-2 gap-3 mt-5">
                                               <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm"><p className="text-[10px] text-rose-100/80">可捐赠金币</p><p className="text-xl font-black mt-1">{currentCoins}</p></div>
                                               <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm"><p className="text-[10px] text-rose-100/80">本次点亮</p><p className="text-xl font-black mt-1">{charityInput}</p></div>
                                           </div>
                                           <div className="mt-5 rounded-3xl bg-white/15 border border-white/20 p-3 backdrop-blur-sm">
                                               <div className="flex items-center justify-between gap-2 mb-3">
                                                   {[50, 100, 200, 500].map(amount => {
                                                       const overBalance = amount > currentCoins;
                                                       const overStage = charityStageProgress ? amount > charityStageProgress.remaining : false;
                                                       const disabled = overBalance || overStage || charityStageProgress?.isFull;
                                                       return (
                                                       <motion.button
                                                           key={amount}
                                                           whileTap={!disabled ? { scale: 0.92 } : undefined}
                                                           disabled={disabled}
                                                           onClick={() => { setCharityInput(amount); setCharityStageHint(''); }}
                                                           className={`flex-1 h-10 rounded-2xl text-xs font-black border transition-all ${charityInput === amount && !disabled ? 'bg-white text-rose-600 border-white shadow-lg' : disabled ? 'bg-white/10 text-white/35 border-white/10 grayscale' : 'bg-white/10 text-white border-white/15'}`}
                                                       >
                                                           {amount}
                                                       </motion.button>
                                                       );
                                                   })}
                                               </div>
                                               <motion.button
                                                   whileTap={!charityStageProgress?.isFull && charityInput <= currentCoins ? { scale: 0.96 } : undefined}
                                                   disabled={charityStageProgress?.isFull || charityInput > currentCoins || (charityStageProgress ? charityInput > charityStageProgress.remaining : false)}
                                                   onClick={handleCharityDonate}
                                                   className={`w-full py-3.5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 ${charityStageProgress?.isFull ? 'bg-white/20 text-white/45' : 'bg-white text-rose-600'}`}
                                               >
                                                   <Heart size={16} fill="currentColor" /> {charityStageProgress?.isFull ? '本阶段已满，感谢参与' : '一键点亮爱心'}
                                               </motion.button>
                                               {charityStageHint ? <p className="text-[10px] text-amber-200 text-center mt-2 font-bold">{charityStageHint}</p> : null}
                                               <p className="text-[10px] text-rose-50/80 text-center mt-2 font-bold">不用跳转，点一下就把学习金币变成爱心</p>
                                           </div>
                                       </div>
                                       <div className="grid gap-4">
                                           <div className="rounded-[28px] p-5 bg-white/5 border border-white/10 text-white">
                                               <div className="flex items-center justify-between mb-3"><p className="font-black">爱心池总览</p><PiggyBank size={18} className="text-rose-300" /></div>
                                               <div className="grid grid-cols-2 gap-3 text-sm">
                                                   <div><p className="text-white/40 text-[10px]">累计捐赠金币</p><p className="font-black text-lg">128,800</p></div>
                                                   <div><p className="text-white/40 text-[10px]">参与人数</p><p className="font-black text-lg">3,642</p></div>
                                                   <div><p className="text-white/40 text-[10px]">企业配捐</p><p className="font-black text-lg">¥12,880</p></div>
                                                   <div><p className="text-white/40 text-[10px]">爱心池余额</p><p className="font-black text-lg">¥28,600</p></div>
                                               </div>
                                           </div>
                                           <div className="rounded-[28px] p-5 bg-white/5 border border-white/10 text-white">
                                               <p className="font-black mb-2">爱心大使荣誉</p>
                                               <div className="flex items-center gap-3 flex-wrap">
                                                   <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-black">爱心小星星</span>
                                                   <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 text-xs font-black">爱心小天使</span>
                                                   <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-black">爱心大使</span>
                                               </div>
                                           </div>
                                       </div>
                                   </motion.div>
                               )}
                               {charityViewState === 'RECORDS' && (
                                   <motion.div key="records" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-3 max-w-2xl mx-auto text-white">
                                       {[
                                           { date: '2026-06-03 19:42', points: 300, amount: 3 },
                                           { date: '2026-06-05 20:18', points: 100, amount: 1 },
                                           { date: '2026-06-09 18:06', points: charityInput, amount: charityInput / 100 },
                                       ].map((record, index) => (
                                           <motion.div key={`${record.date}-${index}`} whileHover={{ x: 4 }} className="rounded-[24px] p-4 bg-white/5 border border-white/10">
                                               <div className="flex items-start justify-between gap-4">
                                                   <div>
                                                       <p className="text-[10px] text-white/40 font-bold mb-1">捐赠时间</p>
                                                       <p className="font-black text-white">{record.date}</p>
                                                   </div>
                                                   <div className="text-right">
                                                       <p className="text-[10px] text-white/40 font-bold mb-1">折算金额</p>
                                                       <p className="font-black text-rose-200">¥{record.amount.toFixed(2)}</p>
                                                   </div>
                                               </div>
                                               <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                                   <span className="text-xs text-white/45 font-bold">捐赠金币</span>
                                                   <span className="text-lg font-black text-white">{record.points} 金币</span>
                                               </div>
                                           </motion.div>
                                       ))}
                                   </motion.div>
                               )}
                               {charityViewState === 'CERTIFICATE' && (
                                   <motion.div key="certificate" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="max-w-3xl mx-auto space-y-4 text-white">
                                       {charityJustDonated && (
                                           <div className="relative overflow-hidden rounded-[28px] p-5 bg-rose-500/15 border border-rose-300/20">
                                               <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                                   {[0, 1, 2, 3, 4, 5].map(i => (
                                                       <motion.div
                                                           key={i}
                                                           initial={{ opacity: 0, y: 70, scale: 0.5 }}
                                                           animate={{ opacity: [0, 1, 0], y: -120, scale: [0.5, 1.1, 0.8], rotate: i % 2 ? 18 : -18 }}
                                                           transition={{ duration: 1.8, delay: i * 0.12, ease: 'easeOut' }}
                                                           className="absolute bottom-4 text-rose-300"
                                                           style={{ left: `${16 + i * 13}%` }}
                                                       >
                                                           <Heart size={18 + i * 2} fill="currentColor" />
                                                       </motion.div>
                                                   ))}
                                               </div>
                                               <div className="relative z-10 flex items-center gap-4">
                                                   <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/25">
                                                       <Heart size={26} fill="currentColor" />
                                                   </div>
                                                   <div>
                                                       <p className="text-[10px] text-rose-200 font-black tracking-[0.2em]">点亮成功</p>
                                                       <h3 className="text-xl font-black mt-1">你为爱心池添了一点光</h3>
                                                       <p className="text-xs text-white/55 mt-1">这份小小助力会和更多同学的心意一起汇聚。</p>
                                                   </div>
                                               </div>
                                           </div>
                                       )}

                                       <div className="rounded-[32px] p-6 bg-white text-slate-900 border border-rose-100 shadow-2xl">
                                           <div className="flex items-center justify-between gap-4 mb-5">
                                               <div>
                                                   <p className="text-rose-500 font-black tracking-[0.2em] text-xs">我的爱心身份</p>
                                                   <h3 className="text-2xl font-black mt-2">{currentCharityLevel.title}</h3>
                                                   <p className="text-sm text-slate-500 mt-1">累计爱心值 ¥{totalCharityAmount.toFixed(2)}</p>
                                               </div>
                                               <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${currentCharityLevel.tone} flex items-center justify-center text-4xl shadow-xl`}>
                                                   {currentCharityLevel.icon}
                                               </div>
                                           </div>
                                           {nextCharityLevel ? (
                                               <div className="rounded-3xl bg-rose-50 border border-rose-100 p-4">
                                                   <div className="flex justify-between text-xs font-black text-rose-500 mb-2">
                                                       <span>距离「{nextCharityLevel.title}」</span>
                                                       <span>还差 ¥{Math.max(0, nextCharityLevel.threshold - totalCharityAmount).toFixed(2)}</span>
                                                   </div>
                                                   <div className="h-3 rounded-full bg-white overflow-hidden border border-rose-100">
                                                       <div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full" style={{ width: `${Math.min(100, (totalCharityAmount / nextCharityLevel.threshold) * 100)}%` }} />
                                                   </div>
                                               </div>
                                           ) : (
                                               <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-600 text-sm font-black text-center">已获得全部爱心身份称号</div>
                                           )}
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                           {charityLevels.map(level => {
                                               const unlocked = totalCharityAmount >= level.threshold;
                                               return (
                                                   <motion.div key={level.title} whileHover={unlocked ? { y: -3 } : undefined} className={`rounded-[28px] p-5 border relative overflow-hidden ${unlocked ? 'bg-white text-slate-900 border-rose-100 shadow-xl' : 'bg-white/5 text-white/45 border-white/10 grayscale'}`}>
                                                       <div className="flex items-center gap-4">
                                                           <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${level.tone} flex items-center justify-center text-2xl ${unlocked ? '' : 'opacity-40'}`}>
                                                               {unlocked ? level.icon : <Lock size={20} />}
                                                           </div>
                                                           <div className="flex-1 min-w-0">
                                                               <p className={`text-[10px] font-black tracking-[0.18em] ${unlocked ? 'text-rose-500' : 'text-white/30'}`}>{unlocked ? '已获得证书' : `累计 ¥${level.threshold} 解锁`}</p>
                                                               <h4 className="font-black text-lg mt-1">{level.certificate}</h4>
                                                               <p className="text-xs mt-1 opacity-60">{level.title}</p>
                                                           </div>
                                                           {unlocked && <BadgeCheck size={20} className="text-rose-500" />}
                                                       </div>
                                                   </motion.div>
                                               );
                                           })}
                                       </div>

                                       <p className="text-center text-[10px] text-white/35 font-bold leading-relaxed px-4">爱心身份只记录持续参与，不代表爱心大小。每一份小小心意都值得被认真记录。</p>
                                   </motion.div>
                               )}
                           </AnimatePresence>
                       </div>
                   </motion.div>
               </motion.div>
           )}
       </AnimatePresence>

       {/* Wardrobe Modal */}
       <WardrobeModal 
           isOpen={isWardrobeOpen} 
           onClose={() => setIsWardrobeOpen(false)} 
           onOutfitChange={() => {
               // Refresh data to show new outfit on avatar
               getUserGrowthData().then(setData);
           }}
           onOpenStore={onOpenStore}
       />
    </div>
  );
};
