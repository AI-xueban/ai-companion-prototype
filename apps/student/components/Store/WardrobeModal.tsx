import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Shirt, Check, ShoppingBag } from 'lucide-react';
import { OUTFIT_CATALOG, equipOutfit, getUserGrowthData } from '../../services/geminiService';
import { OutfitItem, OutfitCategory } from '../../types';
import { UserAvatarImage } from '../User/UserAvatarImage';
import girlAvatar from '../../assets/girl_v0.1-removebg-preview.png';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOutfitChange?: () => void; // Callback when outfit is saved
  onOpenStore?: () => void; // Link to store
}

type OutfitTab = 'headwear' | 'handheld' | 'outfit';

export const WardrobeModal: React.FC<WardrobeModalProps> = ({ isOpen, onClose, onOutfitChange, onOpenStore }) => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<OutfitTab>('headwear');
  
  // Data State
  const [unlockedOutfits, setUnlockedOutfits] = useState<string[]>([]);
  const [equippedOutfit, setEquippedOutfit] = useState<any>({});
  const [previewOutfit, setPreviewOutfit] = useState<any>({}); // For try-on
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPortalTarget(
        document.getElementById('app-viewport') ||
        document.getElementById('modal-root') ||
        null
    );
    if (isOpen) {
        // Init data
        getUserGrowthData().then(data => {
            setUnlockedOutfits(data.unlockedOutfitIds);
            setEquippedOutfit(data.currentOutfit);
            setPreviewOutfit(data.currentOutfit); // Start with current
        });
    }
  }, [isOpen]);

  const handleTryOn = (item: OutfitItem) => {
      setPreviewOutfit((prev: any) => ({
          ...prev,
          [item.category]: prev[item.category] === item.id ? undefined : item.id
      }));
  };

  const handleSaveOutfit = async () => {
      setIsSaving(true);
      // Save all changed categories
      for (const cat of ['headwear', 'handheld', 'outfit'] as OutfitCategory[]) {
          // If the item in preview is different from equipped, or if it was removed (undefined)
          if (previewOutfit[cat] !== equippedOutfit[cat]) {
               await equipOutfit(cat, previewOutfit[cat]);
          }
      }
      setEquippedOutfit(previewOutfit);
      setIsSaving(false);
      if (onOutfitChange) onOutfitChange();
      onClose();
  };

  const handleResetPreview = () => {
      setPreviewOutfit(equippedOutfit);
  };

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              data-modal-backdrop="true"
              className="absolute inset-0 z-[980] pointer-events-auto"
          />
          <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              data-modal-surface="true"
              className="absolute inset-x-4 inset-y-8 md:inset-20 bg-white rounded-[40px] shadow-2xl z-[990] flex flex-col overflow-hidden pointer-events-auto max-w-5xl mx-auto"
          >
              {/* Header */}
              <div className="px-6 py-5 bg-white border-b border-gray-100 shrink-0 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                          <Shirt size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                          <h2 className="text-xl font-black text-gray-800">我的衣橱</h2>
                          <p className="text-xs text-gray-400 font-bold">已拥有 {unlockedOutfits.length} 件装扮</p>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                      {onOpenStore && (
                          <button 
                              onClick={() => {
                                  onClose();
                                  onOpenStore();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-full transition-colors duration-200 group"
                          >
                              <ShoppingBag size={16} className="group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-bold">去商店</span>
                          </button>
                      )}
                      <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                          <X size={20} />
                      </button>
                  </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden relative bg-gray-50/50 flex flex-col md:flex-row">
                  
                  {/* Left: Preview Area */}
                  <div className="w-full md:w-1/3 bg-white border-r border-gray-100 p-6 flex flex-col items-center justify-center relative">
                        <div className="absolute top-4 left-4 bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-400">
                            试穿预览
                        </div>
                        <div className="w-64 h-64 relative">
                            <UserAvatarImage 
                                size="xl" 
                                variant="full"
                                className="w-full h-full"
                                showShadow={true}
                                fallbackImageSrc={girlAvatar}
                                currentOutfit={previewOutfit}
                            />
                        </div>
                        <div className="flex gap-3 mt-8 w-full px-4">
                            <button 
                                onClick={handleResetPreview}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50"
                            >
                                还原
                            </button>
                            <button 
                                onClick={handleSaveOutfit}
                                disabled={isSaving}
                                className="flex-[2] py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSaving ? '保存中...' : (
                                    <>
                                        <Sparkles size={14} />
                                        确认穿搭
                                    </>
                                )}
                            </button>
                        </div>
                  </div>

                  {/* Right: Catalog */}
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Sub-Categories */}
                        <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
                            {(['headwear', 'handheld', 'outfit'] as OutfitTab[]).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 whitespace-nowrap ${
                                        activeCategory === cat 
                                        ? 'bg-white border-brand text-brand shadow-sm' 
                                        : 'bg-transparent border-transparent text-gray-400 hover:bg-white hover:text-gray-600'
                                    }`}
                                >
                                    {cat === 'headwear' && '头饰'}
                                    {cat === 'handheld' && '手持'}
                                    {cat === 'outfit' && '套装'}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-6 pt-0">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {OUTFIT_CATALOG
                                    .filter(i => i.category === activeCategory && i.target === 'user') // Only show User items
                                    .map(item => {
                                    const isUnlocked = unlockedOutfits.includes(item.id);
                                    // Only show unlocked items or free items (price 0 usually means free/default)
                                    // If we want to show locked items in wardrobe? Requirement says "仅展示已拥有的物品"
                                    // But typically wardrobe might show locked items as grayed out or not show at all.
                                    // "仅展示已拥有的物品" -> strict filter.
                                    if (!isUnlocked && item.price > 0) return null;

                                    const isEquippedInPreview = previewOutfit[item.category] === item.id;
                                    
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleTryOn(item)}
                                            className={`relative p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all group ${
                                                isEquippedInPreview 
                                                    ? 'bg-brand/5 border-brand shadow-md' 
                                                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        >
                                            {/* Asset Preview */}
                                            <div className="text-4xl mb-3 h-12 flex items-center justify-center filter drop-shadow-sm transition-transform group-hover:scale-110">
                                                {item.assetUrl}
                                            </div>
                                            
                                            <h4 className="font-bold text-gray-800 text-sm mb-1">{item.name}</h4>
                                            
                                            {/* Equipped Badge */}
                                            {isEquippedInPreview && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-brand text-white rounded-full flex items-center justify-center shadow-sm">
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                {/* Empty State if no items */}
                                {OUTFIT_CATALOG.filter(i => i.category === activeCategory && i.target === 'user' && (unlockedOutfits.includes(i.id) || i.price === 0)).length === 0 && (
                                    <div className="col-span-full py-10 text-center text-gray-400 text-xs font-bold">
                                        暂无该分类下的装扮
                                    </div>
                                )}
                            </div>
                        </div>
                  </div>
              </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
};
