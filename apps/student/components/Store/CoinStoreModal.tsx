import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Coins, Shirt, Check, Bot } from 'lucide-react';
import avatarNezha from '../../assets/Avatar-哪吒.jpg';
import avatarHolmes from '../../assets/Avatar-福尔摩斯.jpg';
import avatarChangE from '../../assets/Avatar-嫦娥.jpg';
import avatarEinstein from '../../assets/Avatar-爱因斯坦.jpg';
import { OUTFIT_CATALOG, buyOutfit, getUserGrowthData } from '../../services/geminiService';
import { OutfitItem, OutfitCategory } from '../../types';
import {
  INITIAL_WISH_APPLICATIONS,
  WISH_POOL_GOODS,
  WishApplication,
  WishPoolGoods,
  getWishGoodsAccentStyle,
} from '../../data/wishPoolStudentData';

interface CoinStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onCoinsChange?: (newCoins: number) => void;
}

type StoreTab = 'outfits' | 'tickets';
type OutfitTab = 'headwear' | 'handheld' | 'outfit';
type DecorationTarget = 'user' | 'lumi';
type WishPoolFilter = 'all' | 'pending' | 'rejected' | 'exchanged';

const AVATAR_MAP: Record<string, string> = {
    'headphones': avatarNezha,
    'glasses': avatarEinstein,
    'hat': avatarHolmes,
    'scarf': avatarChangE
};

export const CoinStoreModal: React.FC<CoinStoreModalProps> = ({ isOpen, onClose, coins: initialCoins, onCoinsChange }) => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<StoreTab>('outfits');
  const [decorationTarget, setDecorationTarget] = useState<DecorationTarget>('user');
  const [activeOutfitCategory, setActiveOutfitCategory] = useState<OutfitTab>('headwear');
  
  const [currentCoins, setCurrentCoins] = useState(initialCoins);
  const [unlockedOutfits, setUnlockedOutfits] = useState<string[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [wishApplications, setWishApplications] = useState<WishApplication[]>(INITIAL_WISH_APPLICATIONS);
  const [wishPoolFilter, setWishPoolFilter] = useState<WishPoolFilter>('all');
  const [wishConfirmGoods, setWishConfirmGoods] = useState<WishPoolGoods | null>(null);

  useEffect(() => {
    setPortalTarget(
        document.getElementById('app-viewport') ||
        document.getElementById('modal-root') ||
        null
    );
    if (isOpen) {
        getUserGrowthData().then(data => {
            setCurrentCoins(data.coins);
            setUnlockedOutfits(data.unlockedOutfitIds);
        });
    } else {
        setWishConfirmGoods(null);
    }
  }, [isOpen]);

  useEffect(() => {
      if (initialCoins !== currentCoins && onCoinsChange) {
          onCoinsChange(currentCoins);
      }
  }, [currentCoins]);

  const handleBuy = async (item: OutfitItem) => {
      setIsBuying(true);
      const res = await buyOutfit(item.id);
      if (res.success) {
          setCurrentCoins(prev => prev - item.price);
          setUnlockedOutfits(prev => [...prev, item.id]);
      } else {
          alert(res.message);
      }
      setIsBuying(false);
  };

  const pendingWishApplications = wishApplications.filter((item) => item.status === 'pending');
  const frozenWishCoins = pendingWishApplications.reduce((sum, item) => sum + item.price, 0);

  const { activeWishGoods, exchangedWishGoods } = useMemo(() => {
      const active: WishPoolGoods[] = [];
      const exchanged: WishPoolGoods[] = [];
      for (const goods of WISH_POOL_GOODS) {
          const applications = wishApplications.filter((item) => item.goodsId === goods.id);
          const hasPending = applications.some((item) => item.status === 'pending');
          const doneCount = applications.filter((item) => item.status === 'done').length;
          const reachedLimit = doneCount >= goods.limitPerUser;
          // 未达个人限兑上限时仍留在「全部」，方便展示「限兑 N 次 · 已兑 M」
          if (reachedLimit && !hasPending) {
              exchanged.push(goods);
          } else {
              active.push(goods);
          }
      }
      return { activeWishGoods: active, exchangedWishGoods: exchanged };
  }, [wishApplications]);

  const getGoodsApplications = (goodsId: string) =>
      wishApplications.filter((item) => item.goodsId === goodsId);

  const hasRejectedApplication = (goodsId: string) => {
      const applications = getGoodsApplications(goodsId);
      if (applications.some((item) => item.status === 'pending')) return false;
      return applications.some((item) => item.status === 'rejected');
  };

  const rejectedWishGoods = useMemo(
      () => activeWishGoods.filter(
          (goods) => goods.shelfStatus !== 'off' && hasRejectedApplication(goods.id),
      ),
      [activeWishGoods, wishApplications],
  );

  const sortWishGoodsForAll = (goods: WishPoolGoods[]) =>
      [...goods].sort((a, b) => {
          const rank = (item: WishPoolGoods) => (item.shelfStatus === 'off' ? 1 : 0);
          return rank(a) - rank(b);
      });

  const filteredWishGoods = useMemo(() => {
      switch (wishPoolFilter) {
          case 'pending':
              return activeWishGoods.filter((goods) =>
                  getGoodsApplications(goods.id).some((item) => item.status === 'pending'),
              );
          case 'rejected':
              return rejectedWishGoods;
          case 'exchanged':
              return exchangedWishGoods;
          default:
              return sortWishGoodsForAll(activeWishGoods);
      }
  }, [activeWishGoods, exchangedWishGoods, rejectedWishGoods, wishPoolFilter, wishApplications]);

  const handleApplyWish = (goods: WishPoolGoods) => {
      if (goods.shelfStatus === 'off') return;
      const hasPending = wishApplications.some(
          (item) => item.goodsId === goods.id && item.status === 'pending',
      );
      if (hasPending) {
          alert('该商品已有申请在处理中，请等待老师核销。');
          return;
      }
      if (currentCoins < goods.price) {
          alert('金币不足，先去完成任务赚金币吧～');
          return;
      }
      setWishConfirmGoods(goods);
  };

  const confirmApplyWish = () => {
      if (!wishConfirmGoods) return;
      const goods = wishConfirmGoods;

      const appliedAt = new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
      }).replace(/\//g, '-');

      setCurrentCoins((prev) => prev - goods.price);
      setWishApplications((prev) => [
          {
              id: `w-${Date.now()}`,
              goodsId: goods.id,
              goodsName: goods.name,
              price: goods.price,
              status: 'pending',
              appliedAt,
              handler: '',
              handledAt: '',
              rejectReason: '',
          },
          ...prev,
      ]);
      setWishConfirmGoods(null);
  };

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
          <motion.div
              key="coin-store-page"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute inset-0 z-[990] flex flex-col overflow-hidden bg-slate-900 pointer-events-auto"
          >
              {/* Header */}
              <div className="px-4 py-2.5 bg-white/5 border-b border-white/5 shrink-0 flex justify-between items-center relative z-10 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                      <button
                          type="button"
                          onClick={onClose}
                          aria-label="返回"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                          <ChevronLeft size={20} />
                      </button>
                      <div className="w-8 h-8 shrink-0 bg-brand rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand/30 border border-white/20">
                          <ShoppingBag size={15} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                          <h2 className="text-[15px] font-semibold text-white leading-none">金币商店</h2>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <div className="flex items-center gap-1 text-yellow-400 font-bold text-[11px] bg-yellow-400/10 px-1.5 py-0.5 rounded-full w-fit border border-yellow-400/20">
                                  <Coins size={10} className="fill-yellow-400" />
                                  <span>{currentCoins}</span>
                                  <span className="text-yellow-400/50 font-medium">可用</span>
                              </div>
                              {frozenWishCoins > 0 ? (
                                  <div className="flex items-center gap-1 text-amber-300/80 font-bold text-[11px] bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20">
                                      {frozenWishCoins} 冻结中
                                  </div>
                              ) : null}
                          </div>
                      </div>
                  </div>
                  
                  {/* Tabs (iOS Segmented Control Style) */}
                  <div className="hidden md:flex bg-black/20 p-0.5 rounded-full border border-white/5 backdrop-blur-md shrink-0">
                        {(['outfits', 'tickets'] as StoreTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all ${
                                    activeTab === tab 
                                    ? 'bg-white/10 text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)] ring-1 ring-white/20' 
                                    : 'text-white/40 hover:text-white/60'
                                }`}
                            >
                                {tab === 'outfits' && '装扮商城'}
                                {tab === 'tickets' && '许愿池'}
                            </button>
                        ))}
                  </div>
              </div>

              {/* Mobile Tabs */}
              <div className="md:hidden px-4 py-1.5 border-b border-white/5 overflow-x-auto flex gap-1.5 no-scrollbar bg-black/10">
                   {(['outfits', 'tickets'] as StoreTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                                activeTab === tab 
                                ? 'bg-brand/20 border-brand text-white shadow-lg shadow-brand/20' 
                                : 'bg-white/5 border-white/5 text-white/40'
                            }`}
                        >
                             {tab === 'outfits' && '装扮商城'}
                             {tab === 'tickets' && '许愿池'}
                        </button>
                   ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden relative bg-transparent">
                  
                  {activeTab === 'outfits' && (
                      <div className="flex flex-col h-full">
                          
                          {/* Target Switch & Categories */}
                          <div className="bg-white/5 px-4 py-2.5 border-b border-white/5 flex flex-col md:flex-row gap-2.5 items-center justify-between shadow-lg relative z-10 backdrop-blur-md">
                                {/* Target Switch */}
                                <div className="flex bg-black/30 p-0.5 rounded-lg w-full md:w-auto border border-white/5">
                                    <button
                                        onClick={() => setDecorationTarget('user')}
                                        className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                            decorationTarget === 'user' 
                                            ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/20' 
                                            : 'text-white/30 hover:text-white/50'
                                        }`}
                                    >
                                        <Shirt size={12} /> 我的装扮
                                    </button>
                                    <button
                                        onClick={() => setDecorationTarget('lumi')}
                                        className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                            decorationTarget === 'lumi' 
                                            ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/20' 
                                            : 'text-white/30 hover:text-white/50'
                                        }`}
                                    >
                                        <Bot size={12} /> 小晤 形象
                                    </button>
                                </div>

                                {/* Categories - Only show for User */}
                                {decorationTarget === 'user' && (
                                    <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-0.5 no-scrollbar">
                                        {(['headwear', 'handheld', 'outfit'] as OutfitTab[]).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveOutfitCategory(cat)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border whitespace-nowrap ${
                                                    activeOutfitCategory === cat 
                                                    ? 'bg-brand/20 border-brand text-white shadow-[0_0_15px_rgba(108,93,211,0.3)]' 
                                                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                                                }`}
                                            >
                                                {cat === 'headwear' && '头饰'}
                                                {cat === 'handheld' && '手持'}
                                                {cat === 'outfit' && '套装'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                          </div>

                          {/* Grid */}
                          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {OUTFIT_CATALOG
                                        .filter(i => {
                                            if (i.target !== decorationTarget) return false;
                                            if (decorationTarget === 'user') return i.category === activeOutfitCategory;
                                            return true; // Lumi shows all categories
                                        })
                                        .map(item => {
                                        const isUnlocked = unlockedOutfits.includes(item.id);
                                        
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => !isUnlocked && handleBuy(item)}
                                                disabled={isBuying || (item.isLocked && !isUnlocked)}
                                                className={`relative p-3 rounded-2xl border flex flex-col items-center text-center transition-all group aspect-square justify-between shadow-lg ${
                                                    isUnlocked 
                                                        ? 'bg-white/5 border-white/5 opacity-60' 
                                                        : 'bg-white/5 border-white/10 hover:border-brand/50 hover:bg-white/10 hover:shadow-brand/10 hover:-translate-y-1'
                                                } ${item.isLocked && !isUnlocked ? 'opacity-40 grayscale' : ''}`}
                                            >
                                                {/* Asset Preview */}
                                                {AVATAR_MAP[item.id] && item.target === 'lumi' ? (
                                                    <div className="w-full aspect-[4/5] mb-2 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform border border-white/10">
                                                        <img src={AVATAR_MAP[item.id]} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="text-3xl mt-1 filter drop-shadow-2xl transition-transform group-hover:scale-110 mb-1">
                                                        {item.assetUrl}
                                                    </div>
                                                )}
                                                
                                                <div className="w-full">
                                                    <h4 className="font-bold text-white/90 text-[12px] mb-0.5 truncate">{item.name}</h4>
                                                    
                                                    {/* Action State */}
                                                    <div className="mt-1.5">
                                                        {isUnlocked ? (
                                                            <div className="text-[11px] font-bold text-white/20 flex items-center justify-center gap-1">
                                                                <Check size={11} /> 已拥有
                                                            </div>
                                                        ) : item.isLocked ? (
                                                            <div className="text-[10px] font-bold text-white/30 bg-white/5 py-1 rounded-md border border-white/5">
                                                                🔒 {item.unlockCondition}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[11px] font-bold text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 py-1 rounded-md flex items-center justify-center gap-1 transition-colors border border-yellow-500/20 shadow-inner">
                                                                <Coins size={11} /> {item.price}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {OUTFIT_CATALOG.filter(i => {
                                        if (i.target !== decorationTarget) return false;
                                        if (decorationTarget === 'user') return i.category === activeOutfitCategory;
                                        return true;
                                    }).length === 0 && (
                                        <div className="col-span-full py-16 text-center text-gray-400 font-bold text-[12px] flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">📦</div>
                                            该分类下暂无商品
                                        </div>
                                    )}
                                </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'tickets' && (
                      <div className="flex flex-col h-full min-h-0">
                          <div className="bg-white/5 px-4 py-2.5 border-b border-white/5 shadow-lg relative z-10 backdrop-blur-md">
                              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                                  {([
                                      { id: 'all' as const, label: '全部' },
                                      { id: 'pending' as const, label: '待核销', count: pendingWishApplications.length },
                                      { id: 'rejected' as const, label: '已拒绝', count: rejectedWishGoods.length },
                                      { id: 'exchanged' as const, label: '已兑换', count: exchangedWishGoods.length },
                                  ]).map((filter) => (
                                      <button
                                          key={filter.id}
                                          type="button"
                                          onClick={() => setWishPoolFilter(filter.id)}
                                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border whitespace-nowrap flex items-center gap-1 ${
                                              wishPoolFilter === filter.id
                                                  ? 'bg-brand/20 border-brand text-white shadow-[0_0_15px_rgba(108,93,211,0.3)]'
                                                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                                          }`}
                                      >
                                          {filter.label}
                                          {filter.count ? (
                                              <span className="min-w-[16px] h-4 px-1 rounded-full bg-white/10 text-[10px] font-black flex items-center justify-center">
                                                  {filter.count}
                                              </span>
                                          ) : null}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-stretch">
                                  {filteredWishGoods.map((goods) => (
                                      <div key={goods.id} className="aspect-square w-full">
                                      <WishPoolGridCard
                                          goods={goods}
                                          coins={currentCoins}
                                          applications={getGoodsApplications(goods.id)}
                                          emphasizeRejected={wishPoolFilter === 'rejected'}
                                          onApply={() => handleApplyWish(goods)}
                                      />
                                      </div>
                                  ))}
                                  {filteredWishGoods.length === 0 ? (
                                      <div className="col-span-full py-16 text-center text-white/35 font-bold text-[12px] flex flex-col items-center gap-2">
                                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                              <Coins size={16} className="text-white/25" />
                                          </div>
                                          {wishPoolFilter === 'pending' && '暂无待核销的兑换'}
                                          {wishPoolFilter === 'rejected' && '暂无被拒绝的兑换'}
                                          {wishPoolFilter === 'exchanged' && '还没有已兑换的商品'}
                                          {wishPoolFilter === 'all' && '许愿池暂无商品'}
                                      </div>
                                  ) : null}
                              </div>
                          </div>

                          <div className="shrink-0 px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                              <p className="text-center text-[11px] text-white/35 font-medium leading-relaxed">
                                  申请兑换时金币会先冻结，等待老师核销；核销通过后线下兑现，未通过则自动退回账户
                              </p>
                          </div>
                      </div>
                  )}

                  {activeTab !== 'outfits' && activeTab !== 'tickets' && (
                      <div className="p-8" />
                  )}

              </div>

              <AnimatePresence>
                  {wishConfirmGoods ? (
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
                          onClick={() => setWishConfirmGoods(null)}
                      >
                          <motion.div
                              initial={{ scale: 0.92, opacity: 0, y: 12 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.92, opacity: 0, y: 12 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                              className="w-full max-w-sm rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl p-4 text-center"
                              onClick={(e) => e.stopPropagation()}
                          >
                              {(() => {
                                  const accent = getWishGoodsAccentStyle(wishConfirmGoods.accent);
                                  const Icon = wishConfirmGoods.icon;
                                  return (
                                      <>
                                          <div className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center mb-3 ${accent.iconBg} border border-white/10`}>
                                              <Icon size={20} strokeWidth={2.2} />
                                          </div>
                                          <h3 className="text-[15px] font-semibold text-white">确认申请兑换？</h3>
                                          <p className="mt-1.5 text-[13px] font-bold text-white/80">{wishConfirmGoods.name}</p>
                                          <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[12px] font-black">
                                              <Coins size={12} className="fill-yellow-400" />
                                              冻结 {wishConfirmGoods.price} 金币
                                          </div>
                                          <p className="mt-3 text-[11px] text-white/40 font-medium leading-relaxed">
                                              提交后金币将冻结，等待老师核销；核销通过后线下兑现，未通过将自动退回账户
                                          </p>
                                          <div className="mt-4 flex items-center gap-2.5">
                                              <button
                                                  type="button"
                                                  onClick={() => setWishConfirmGoods(null)}
                                                  className="flex-1 h-9 rounded-xl bg-white/5 text-white/60 text-[12px] font-bold border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                                              >
                                                  取消
                                              </button>
                                              <button
                                                  type="button"
                                                  onClick={confirmApplyWish}
                                                  className="flex-1 h-9 rounded-xl bg-brand text-white text-[12px] font-bold shadow-lg shadow-brand/30 hover:brightness-110 active:scale-95 transition-all"
                                              >
                                                  确认申请
                                              </button>
                                          </div>
                                      </>
                                  );
                              })()}
                          </motion.div>
                      </motion.div>
                  ) : null}
              </AnimatePresence>
          </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
};

const WishPoolGridCard: React.FC<{
  goods: WishPoolGoods;
  coins: number;
  applications: WishApplication[];
  emphasizeRejected?: boolean;
  onApply: () => void;
}> = ({ goods, coins, applications, emphasizeRejected = false, onApply }) => {
  const accent = getWishGoodsAccentStyle(goods.accent);
  const Icon = goods.icon;
  const pendingApp = applications.find((item) => item.status === 'pending');
  const latestDone = applications.find((item) => item.status === 'done');
  const latestRejected = applications.find((item) => item.status === 'rejected');
  const doneCount = applications.filter((item) => item.status === 'done').length;
  const remainCount = Math.max(0, goods.limitPerUser - doneCount);
  const isOffShelf = goods.shelfStatus === 'off';
  const isSoldOut = goods.stock <= 0;
  const cannotAfford = coins < goods.price;
  const reachedLimit = remainCount <= 0;
  const hasPending = Boolean(pendingApp);
  const canApply = !isOffShelf && !isSoldOut && !hasPending && !cannotAfford && !reachedLimit;
  const isDimmed = hasPending || isOffShelf || reachedLimit || (cannotAfford && !hasPending);

  type FooterTone = 'default' | 'muted' | 'amber' | 'red' | 'green' | 'price';

  const getFooter = (): { label: React.ReactNode; tone: FooterTone } => {
    if (hasPending) {
      return { label: '待核销 · 等待老师确认', tone: 'amber' };
    }
    if (emphasizeRejected && latestRejected && !latestDone) {
      return { label: '已拒绝', tone: 'red' };
    }
    if (isOffShelf) return { label: '已下架', tone: 'muted' };
    if (isSoldOut) return { label: '库存不足', tone: 'muted' };
    if (reachedLimit) {
      return { label: <><Check size={12} /> 已达兑换上限</>, tone: 'muted' };
    }
    if (cannotAfford) return { label: '金币不足', tone: 'muted' };
    if (latestRejected && !latestDone) {
      return { label: '已拒绝 · 可再申请', tone: 'red' };
    }
    // 未达限兑上限时始终展示金币兑换按钮（含「已兑 1 / 限兑 2」场景）
    return {
      label: <><Coins size={12} /> {goods.price}</>,
      tone: 'price',
    };
  };

  const footer = getFooter();
  const footerToneClass: Record<FooterTone, string> = {
    default: 'bg-white/5 border-white/10 text-white/70',
    muted: 'bg-white/5 border-white/5 text-white/30',
    amber: 'bg-amber-400/10 border-amber-400/20 text-amber-300',
    red: 'bg-red-400/10 border-red-400/15 text-red-300/90',
    green: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300/80',
    price: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 group-hover:bg-yellow-500/20',
  };

  return (
    <button
      type="button"
      onClick={() => canApply && onApply()}
      disabled={!canApply}
      className={`relative h-full w-full p-2.5 rounded-2xl border flex flex-col text-center transition-all group shadow-lg ${
        isDimmed
          ? 'bg-white/5 border-white/5 opacity-60 cursor-default'
          : 'bg-white/5 border-white/10 hover:border-brand/50 hover:bg-white/10 hover:shadow-brand/10 hover:-translate-y-1 cursor-pointer'
      } ${isOffShelf ? 'grayscale' : ''}`}
    >
      {hasPending ? (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/25">
          <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
          待核销
        </span>
      ) : null}

      <div
        className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center ${accent.iconBg} border border-white/5 opacity-75 pointer-events-none`}
        aria-hidden
      >
        <Icon size={11} strokeWidth={2} />
      </div>

      <div className="w-full flex-1 flex flex-col justify-center gap-0.5 py-1 px-1 min-h-[3rem]">
        <h4 className="font-bold text-white/90 text-[12px] leading-snug line-clamp-2">{goods.name}</h4>
        <p className="text-[10px] text-white/35 font-bold leading-none">
          {doneCount > 0
            ? `限兑 ${goods.limitPerUser} 次 · 已兑 ${doneCount}${remainCount > 0 ? ` · 剩 ${remainCount} 次` : ''}`
            : `限兑 ${goods.limitPerUser} 次`}
        </p>
        {emphasizeRejected && latestRejected?.rejectReason && !latestDone ? (
          <p className="text-[10px] text-red-200/60 font-medium line-clamp-2 leading-tight px-0.5 mt-0.5">
            {latestRejected.rejectReason}
          </p>
        ) : null}
      </div>

      <div
        className={`w-full h-8 shrink-0 rounded-lg border flex items-center justify-center gap-1 text-[11px] font-bold px-1.5 transition-colors ${footerToneClass[footer.tone]} ${
          footer.tone === 'red' || footer.tone === 'amber' ? 'line-clamp-1' : ''
        }`}
      >
        {footer.label}
      </div>
    </button>
  );
};
