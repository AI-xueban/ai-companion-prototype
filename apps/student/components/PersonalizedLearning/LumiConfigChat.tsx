import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, Clock, AlertCircle } from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';

interface LumiConfigChatProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'sync-mode' | 'exam-mode';
  onConfigComplete?: (config: LearningConfig) => void;
}

interface LearningConfig {
  examDate: Date | null;
  dailyMinutes: number;
  completionDate: Date;
  selectedScopes: string[];
}

type DialogStep = 'welcome' | 'exam-scope' | 'exam-date' | 'time-budget' | 'recipe';

interface RecipeItem {
  id: string;
  title: string;
  icon: string;
  percentage: number;
  reason: string;
  color: string;
}

export const LumiConfigChat: React.FC<LumiConfigChatProps> = ({ 
  isOpen, 
  onClose, 
  mode,
  onConfigComplete 
}) => {
  const [currentStep, setCurrentStep] = useState<DialogStep>('welcome');
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [completionDate, setCompletionDate] = useState<Date>(new Date());
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['c3']);
  const [isDeadlineMissed, setIsDeadlineMissed] = useState(false);
  const [showRecipeAdjust, setShowRecipeAdjust] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mock Scopes
  const MOCK_SCOPES = [
    { id: 'c1', title: '第一章：有理数', status: 'completed' },
    { id: 'c2', title: '第二章：整式的加减', status: 'completed' },
    { id: 'c3', title: '第三章：一元一次方程', status: 'current' },
    { id: 'c4', title: '第四章：几何图形初步', status: 'locked' },
  ];
  
  // Mock Recipe Data
  const [recipe, setRecipe] = useState<RecipeItem[]>([
    {
      id: 'calculation',
      title: '重计算',
      icon: '🔥',
      percentage: 60,
      reason: '检测到历史计算失误率 38%，高于平均水平',
      color: 'red'
    },
    {
      id: 'concept',
      title: '轻概念',
      icon: '🧠',
      percentage: 20,
      reason: '基础概念掌握度 90%，可适当减少',
      color: 'blue'
    },
    {
      id: 'trap',
      title: '防陷阱',
      icon: '🛡️',
      percentage: 20,
      reason: '易错题重现率偏高，需强化防御',
      color: 'amber'
    }
  ]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('welcome');
      setExamDate(null);
      setDailyMinutes(30);
      setSelectedScopes(['c3']);
    }
  }, [isOpen]);

  // Calculate completion date based on daily minutes
  useEffect(() => {
    const totalMinutesNeeded = 600; // Mock: 600 minutes total content
    const daysNeeded = Math.ceil(totalMinutesNeeded / dailyMinutes);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
    
    setCompletionDate(estimatedDate);
    
    if (examDate && estimatedDate > examDate) {
      setIsDeadlineMissed(true);
    } else {
      setIsDeadlineMissed(false);
    }
  }, [dailyMinutes, examDate]);

  // Reset scroll position when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleExamDateSelect = (days: number | null) => {
    if (days === null) {
      // Skip exam date
      setExamDate(null);
      setCurrentStep('time-budget');
    } else if (days === -1) {
      // Custom date option
      setShowCustomDate(true);
    } else {
      const date = new Date();
      date.setDate(date.getDate() + days);
      setExamDate(date);
      setCurrentStep('time-budget');
    }
  };

  const handleCustomDateSelect = (dateStr: string) => {
    if (dateStr) {
      const selectedDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate >= today) {
        setExamDate(selectedDate);
        setShowCustomDate(false);
        setCurrentStep('time-budget');
      }
    }
  };

  const handleConfirmBudget = () => {
    // Go to recipe step instead of completing directly
    setCurrentStep('recipe');
  };

  const handleConfirmRecipe = () => {
    // 直接调用完成回调并关闭，不显示"配置完成"步骤
    if (onConfigComplete) {
      onConfigComplete({
        examDate,
        dailyMinutes,
        completionDate,
        selectedScopes
      });
    }
    onClose();
  };

  const handleScopeToggle = (id: string) => {
    setSelectedScopes(prev => {
        if (prev.includes(id)) {
            return prev.filter(scopeId => scopeId !== id);
        } else {
            return [...prev, id];
        }
    });
  };

  const handleScopeConfirm = () => {
    if (selectedScopes.length > 0) {
        setCurrentStep('exam-date');
    }
  };

  const adjustRecipePercentage = (id: string, delta: number) => {
    setRecipe(prev => {
      const updated = [...prev];
      const index = updated.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const newPercentage = Math.max(0, Math.min(100, updated[index].percentage + delta));
      const oldPercentage = updated[index].percentage;
      const diff = newPercentage - oldPercentage;
      
      if (diff === 0) return prev;
      
      updated[index].percentage = newPercentage;
      
      // Redistribute the difference to other items
      const otherItems = updated.filter((_, i) => i !== index);
      const totalOther = otherItems.reduce((sum, item) => sum + item.percentage, 0);
      
      otherItems.forEach(item => {
        const ratio = item.percentage / totalOther;
        item.percentage = Math.max(0, Math.round(item.percentage - diff * ratio));
      });
      
      // Ensure total is 100
      const total = updated.reduce((sum, item) => sum + item.percentage, 0);
      if (total !== 100) {
        updated[0].percentage += (100 - total);
      }
      
      return updated;
    });
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getDaysUntilExam = () => {
    if (!examDate) return 0;
    const diff = examDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDaysUntilCompletion = () => {
    const diff = completionDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDaysMargin = () => {
    if (!examDate) return 0;
    const diff = examDate.getTime() - completionDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Chat Card - Bottom Sheet Style */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[110] max-h-[82vh] bg-gradient-to-b from-[#E0F2FE] to-[#F0F9FF] rounded-t-[40px] shadow-2xl flex flex-col pb-28"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles size={20} className="text-brand" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">
                    {mode === 'exam-mode' ? '🚀 备考冲刺配置' : '🐢 同步漫游配置'}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">Lumi 正在为你准备...</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/60 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content Area - Scrollable */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-6">
              <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
                {/* Lumi Avatar */}
                <div className="py-4">
                  <InteractiveLumi size="md" emotion="idle" />
                </div>

                <AnimatePresence mode="wait">
                  {/* Step 1: Welcome & Exam Date */}
                  {currentStep === 'welcome' && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full space-y-4"
                    >
                      {/* Lumi Message */}
                      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                        <p className="text-gray-700 font-bold mb-3">
                          检测到你切换到「备考冲刺」模式啦！🚀
                        </p>
                        <p className="text-sm text-gray-600">
                          是不是有考试要准备呀？告诉我考试日期，我帮你安排计划~
                        </p>
                      </div>

                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => setCurrentStep('exam-scope')}
                          className="px-8 py-3 bg-brand text-white rounded-full font-bold shadow-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
                        >
                          开始配置 <Sparkles size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 1.5: Scope Selection */}
                  {currentStep === 'exam-scope' && (
                    <motion.div
                      key="exam-scope"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full space-y-4"
                    >
                      {/* Lumi Message */}
                      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                        <p className="text-gray-700 font-bold mb-2">
                          好的！为了不跑题，我们要先圈定考试范围 🎯
                        </p>
                        <p className="text-sm text-gray-600">
                          这次考试主要覆盖哪些内容呀？
                        </p>
                      </div>

                      {/* Presets */}
                      <div className="flex gap-2">
                        <button 
                            onClick={() => setSelectedScopes(['c3'])}
                            className="flex-1 py-2 bg-white/50 border border-white rounded-xl text-xs font-bold text-gray-600 hover:bg-white transition-colors"
                        >
                            最近所学
                        </button>
                        <button 
                            onClick={() => setSelectedScopes(['c1', 'c2', 'c3'])}
                            className="flex-1 py-2 bg-white/50 border border-white rounded-xl text-xs font-bold text-gray-600 hover:bg-white transition-colors"
                        >
                            期中复习
                        </button>
                      </div>

                      {/* Scope List */}
                      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-white/50 max-h-60 overflow-y-auto">
                        {MOCK_SCOPES.map(scope => (
                            <div 
                                key={scope.id}
                                onClick={() => handleScopeToggle(scope.id)}
                                className={`flex items-center p-3 rounded-xl transition-all cursor-pointer ${
                                    selectedScopes.includes(scope.id) 
                                        ? 'bg-brand/10 border border-brand/20' 
                                        : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 ${
                                    selectedScopes.includes(scope.id)
                                        ? 'bg-brand border-brand text-white'
                                        : 'border-gray-300 bg-white'
                                }`}>
                                    {selectedScopes.includes(scope.id) && <Sparkles size={12} />}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm font-bold ${selectedScopes.includes(scope.id) ? 'text-brand-dark' : 'text-gray-700'}`}>
                                        {scope.title}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                        {scope.status === 'completed' ? '已学完' : scope.status === 'current' ? '进行中' : '未解锁'}
                                    </div>
                                </div>
                            </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setCurrentStep('welcome')}
                          className="px-6 py-3 bg-white/80 border-2 border-gray-200 text-gray-600 rounded-full font-bold hover:bg-white transition-colors"
                        >
                          上一步
                        </button>
                        <button
                          onClick={handleScopeConfirm}
                          disabled={selectedScopes.length === 0}
                          className={`flex-1 px-6 py-3 text-white rounded-full font-bold shadow-lg transition-colors flex items-center justify-center gap-2 ${
                              selectedScopes.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-brand hover:bg-brand-dark'
                          }`}
                        >
                          下一步
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Exam Date (was Step 1) */}
                  {currentStep === 'exam-date' && (
                    <motion.div
                      key="exam-date"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full space-y-4"
                    >
                      {/* Lumi Message */}
                      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                        <p className="text-gray-700 font-bold mb-3">
                          告诉我考试日期，我们要在考试前做好充足的准备~
                        </p>
                      </div>

                      {/* Quick Date Options */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleExamDateSelect(7)}
                          className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border-2 border-white/50 hover:border-brand/50 hover:bg-white transition-all text-left"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-brand" />
                            <span className="font-bold text-sm text-gray-800">一周后</span>
                          </div>
                          <span className="text-xs text-gray-500">7天后</span>
                        </button>

                        <button
                          onClick={() => handleExamDateSelect(14)}
                          className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border-2 border-white/50 hover:border-brand/50 hover:bg-white transition-all text-left"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-brand" />
                            <span className="font-bold text-sm text-gray-800">两周后</span>
                          </div>
                          <span className="text-xs text-gray-500">14天后</span>
                        </button>

                        <button
                          onClick={() => handleExamDateSelect(30)}
                          className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border-2 border-white/50 hover:border-brand/50 hover:bg-white transition-all text-left"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-brand" />
                            <span className="font-bold text-sm text-gray-800">一个月后</span>
                          </div>
                          <span className="text-xs text-gray-500">30天后</span>
                        </button>

                        <button
                          onClick={() => handleExamDateSelect(-1)}
                          className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border-2 border-white/50 hover:border-brand/50 hover:bg-white transition-all text-left"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-brand" />
                            <span className="font-bold text-sm text-gray-800">自定义日期</span>
                          </div>
                          <span className="text-xs text-gray-500">选择具体日期</span>
                        </button>
                      </div>

                      {/* Custom Date Picker */}
                      {showCustomDate && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-700">选择考试日期</span>
                            <button
                              onClick={() => setShowCustomDate(false)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              取消
                            </button>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleCustomDateSelect(e.target.value)}
                              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:outline-none font-bold text-gray-700"
                            />
                            <p className="text-xs text-gray-500">
                              请选择今天或之后的日期
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Skip Option */}
                      {!showCustomDate && (
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleExamDateSelect(null)}
                            className="px-6 py-2 text-sm text-gray-500 hover:text-gray-700 font-bold underline decoration-gray-300 hover:decoration-gray-500 transition-colors"
                          >
                            暂时跳过，随便看看
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Time Budget */}
                  {currentStep === 'time-budget' && (
                    <motion.div
                      key="time-budget"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full space-y-4"
                    >
                      {/* Lumi Message */}
                      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                        <p className="text-gray-700 font-bold mb-2">
                          {examDate ? `距离考试还有 ${getDaysUntilExam()} 天，我算了一下...` : '好的！让我们来规划一下学习节奏~'}
                        </p>
                        <p className="text-sm text-gray-600">
                          拖动滑竿调整每天的学习时间，我会实时告诉你完成日期
                        </p>
                      </div>

                      {/* Time Budget Card */}
                      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-lg">
                        {/* Slider */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Clock size={18} className="text-brand" />
                              <span className="text-sm font-black text-gray-600 uppercase tracking-wider">每日学习时长</span>
                            </div>
                            <span className="text-2xl font-black text-brand">{dailyMinutes} 分钟</span>
                          </div>
                          
                          <div className="relative h-8 flex items-center group">
                            {/* Track */}
                            <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-brand to-purple-500 transition-all duration-300" 
                                style={{ width: `${((dailyMinutes - 10) / 50) * 100}%` }}
                              ></div>
                            </div>
                            
                            {/* Thumb */}
                            <div 
                              className="absolute w-5 h-5 bg-white border-3 border-brand rounded-full shadow-md transition-all duration-300 transform -translate-x-1/2 group-hover:scale-110 group-hover:shadow-lg z-10"
                              style={{ 
                                left: `${((dailyMinutes - 10) / 50) * 100}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <div className="absolute inset-0.5 bg-brand rounded-full opacity-20"></div>
                            </div>
                            
                            <input 
                              type="range" 
                              min="10" 
                              max="60" 
                              step="5"
                              value={dailyMinutes} 
                              onChange={(e) => setDailyMinutes(parseInt(e.target.value))}
                              className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <div className="absolute top-full left-0 right-0 flex justify-between mt-2 text-xs text-gray-400 font-bold">
                              <span>10min</span>
                              <span>60min</span>
                            </div>
                          </div>
                        </div>

                        {/* Result Display */}
                        <div className={`p-4 rounded-2xl border-2 transition-all ${isDeadlineMissed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-600">预计完成日期</span>
                            <span className={`text-lg font-black ${isDeadlineMissed ? 'text-red-600' : 'text-green-600'}`}>
                              {formatDate(completionDate)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-bold">
                            {examDate ? (
                              isDeadlineMissed ? (
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle size={14} />
                                  <span>比考试晚 {Math.abs(getDaysMargin())} 天 😰</span>
                                </div>
                              ) : (
                                <span className="text-green-600">✅ 比考试提前 {getDaysMargin()} 天</span>
                              )
                            ) : (
                              <span>{getDaysUntilCompletion()} 天后完成</span>
                            )}
                          </div>
                        </div>

                        {/* Warning Message */}
                        {isDeadlineMissed && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl"
                          >
                            <p className="text-sm font-bold text-red-600 mb-1">
                              哎呀！按这个速度赶不上考试哦 
                            </p>
                            <p className="text-xs text-red-500">
                              建议每天至少学习 {Math.ceil(600 / getDaysUntilExam())} 分钟
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentStep('exam-scope')}
                          className="flex-1 px-6 py-3 bg-white/80 border-2 border-gray-200 text-gray-600 rounded-full font-bold hover:bg-white transition-colors"
                        >
                          返回上一步
                        </button>
                        <button
                          onClick={handleConfirmBudget}
                          className="flex-1 px-6 py-3 bg-brand text-white rounded-full font-bold shadow-lg hover:bg-brand-dark transition-colors"
                        >
                          👍 就这样
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Recipe */}
                  {currentStep === 'recipe' && (
                    <motion.div
                      key="recipe"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full space-y-4"
                    >
                      {/* Lumi Message */}
                      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                        <p className="text-gray-700 font-bold mb-2">
                          根据你的历史数据，我为你定制了学习配方 ✨
                        </p>
                        <p className="text-sm text-gray-600">
                          这个配方能帮你高效突破薄弱环节~
                        </p>
                      </div>

                      {/* Recipe Cards */}
                      <div className="space-y-3">
                        {recipe.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                  <div className="font-black text-gray-800">{item.title}</div>
                                  <div className="text-xs text-gray-500">{item.reason}</div>
                                </div>
                              </div>
                              <div className="text-2xl font-black text-brand">
                                {item.percentage}%
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  item.color === 'red' ? 'bg-red-500' :
                                  item.color === 'blue' ? 'bg-blue-500' :
                                  'bg-amber-500'
                                }`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Adjust Recipe (Secondary Action) */}
                      {!showRecipeAdjust && (
                        <button
                          onClick={() => setShowRecipeAdjust(true)}
                          className="w-full py-3 bg-gray-50/80 border-2 border-gray-200 text-gray-600 rounded-full font-bold hover:bg-white transition-colors text-sm"
                        >
                          🔧 调整配方
                        </button>
                      )}

                      {/* Recipe Adjustment Panel */}
                      {showRecipeAdjust && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-gray-50/80 backdrop-blur-md rounded-2xl p-5 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-600">微调配方比例</span>
                            <button
                              onClick={() => setShowRecipeAdjust(false)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              收起
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            {recipe.map((item) => (
                              <div key={item.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                  <span>{item.icon}</span>
                                  <span>{item.title}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => adjustRecipePercentage(item.id, -5)}
                                    className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 hover:border-brand hover:bg-brand/10 flex items-center justify-center font-bold text-gray-600 transition-colors"
                                  >
                                    −
                                  </button>
                                  <span className="w-12 text-center font-black text-brand">
                                    {item.percentage}%
                                  </span>
                                  <button
                                    onClick={() => adjustRecipePercentage(item.id, 5)}
                                    className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 hover:border-brand hover:bg-brand/10 flex items-center justify-center font-bold text-gray-600 transition-colors"
                                  >
                                    ＋
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentStep('time-budget')}
                          className="flex-1 px-6 py-3 bg-white/80 border-2 border-gray-200 text-gray-600 rounded-full font-bold hover:bg-white transition-colors"
                        >
                          返回上一步
                        </button>
                        <button
                          onClick={handleConfirmRecipe}
                          className="flex-1 px-6 py-3 bg-brand text-white rounded-full font-bold shadow-lg hover:bg-brand-dark transition-colors"
                        >
                          ✅ 相信小晤
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Decorative Background */}
            <div className="absolute inset-0 pointer-events-none rounded-t-[40px] overflow-hidden -z-10">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-white/40 rounded-full blur-[80px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[60%] bg-purple-100/40 rounded-full blur-[100px]"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

