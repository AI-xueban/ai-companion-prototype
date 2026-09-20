
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { 
    Bot, Sparkles, Zap, Shield, Target, Brain, Activity, ArrowRight, Cpu, Layers, 
    Hexagon, X, Share2, User, Scan, MessageSquare, Box, Music, Users, Leaf, Calculator
} from 'lucide-react';

interface AssessmentResultProps {
  onFinish: () => void;
  onRetake?: () => void;
  mode?: 'initial' | 'review'; 
  userName?: string;
}

// --- NEW DATA STRUCTURE FOR 8 INTELLIGENCES ---

// 1. New Archetypes Definition
const ARCHETYPES = {
    'explorer': {
        title: "维度探索者",
        slogan: "你擅长在脑海中构建多维世界，逻辑与图形是你的双翼。",
        desc: "你的空间想象力与逻辑推理能力双核驱动。相比死记硬背，你更倾向于通过构建模型来理解事物背后的运行机制。",
        color: "text-purple-400",
        bg: "bg-purple-500/20",
        icon: Box
    },
    'narrator': {
        title: "共情叙事者",
        slogan: "语言是你的魔法杖，你能敏锐捕捉他人的情绪微澜。",
        desc: "你拥有极强的言语表达与人际感知力。在团队中，你不仅是沟通的桥梁，更是情绪的共鸣箱。",
        color: "text-blue-400",
        bg: "bg-blue-500/20",
        icon: MessageSquare
    },
    'thinker': {
        title: "深度战略家",
        slogan: "你拥有强大的元认知能力，善于在独处中复盘与进化。",
        desc: "内省与逻辑是你最强的武器。你善于制定长期计划，并能像旁观者一样冷静审视自己的学习过程。",
        color: "text-cyan-400",
        bg: "bg-cyan-500/20",
        icon: Brain
    },
    'sensor': {
        title: "敏捷感知者",
        slogan: "你的感知触角遍布全身，世界对你来说是鲜活的律动。",
        desc: "动觉与自然观察力让你对细微变化极度敏感。你适合在互动与实践中学习，枯燥的理论对你来说不够生动。",
        color: "text-green-400",
        bg: "bg-green-500/20",
        icon: Leaf
    }
};

// 2. Mock 8-Axis Data
// In a real app, this would be computed from the assessment result
const MOCK_SCORES = {
    linguistic: 85,
    logic: 92,
    spatial: 88,
    bodily: 65,
    musical: 70,
    interpersonal: 80,
    intrapersonal: 75,
    naturalist: 60
};

// Helper to determine archetype based on top scores
const getArchetype = (scores: typeof MOCK_SCORES) => {
    // Logic for demo: prioritizing Logic+Spatial for 'explorer'
    if (scores.logic > 80 && scores.spatial > 80) return ARCHETYPES.explorer;
    if (scores.linguistic > 80 && scores.interpersonal > 80) return ARCHETYPES.narrator;
    if (scores.intrapersonal > 80 && scores.logic > 80) return ARCHETYPES.thinker;
    return ARCHETYPES.sensor; // Fallback
};

const currentArchetype = getArchetype(MOCK_SCORES);

const MOCK_DATA = {
    archetype: currentArchetype,
    // 8-Axis Radar Data
    radarData: [
        { subject: '言语', score: MOCK_SCORES.linguistic, prevScore: 70, fullMark: 100, analysis: '词汇联想力惊人，适合费曼学习法' },
        { subject: '逻辑', score: MOCK_SCORES.logic, prevScore: 85, fullMark: 100, analysis: '归纳推理严密，建议多用思维导图' },
        { subject: '空间', score: MOCK_SCORES.spatial, prevScore: 80, fullMark: 100, analysis: '视觉重构力强，利用图解辅助记忆' },
        { subject: '动觉', score: MOCK_SCORES.bodily, prevScore: 60, fullMark: 100, analysis: '反应敏捷，但在静坐专注上需刻意练习' },
        { subject: '音乐', score: MOCK_SCORES.musical, prevScore: 65, fullMark: 100, analysis: '节奏感尚可，可尝试白噪音伴读' },
        { subject: '人际', score: MOCK_SCORES.interpersonal, prevScore: 75, fullMark: 100, analysis: '社交直觉敏锐，适合小组讨论式学习' },
        { subject: '内省', score: MOCK_SCORES.intrapersonal, prevScore: 70, fullMark: 100, analysis: '自我驱动力强，定期复盘效果极佳' },
        { subject: '自然', score: MOCK_SCORES.naturalist, prevScore: 55, fullMark: 100, analysis: '分类思维有待提升，多做知识卡片' },
    ],
    prescription: [
        { label: '优势智能', value: '逻辑 · 空间', icon: Zap, color: 'text-purple-400' },
        { label: '学习模式', value: '模型构建型', icon: Hexagon, color: 'text-blue-400' },
        { label: '每日重心', value: '错题归因', icon: Target, color: 'text-red-400' },
    ],
    projection: [
        { day: '1', score: 78 },
        { day: '3', score: 82 },
        { day: '7', score: 85 },
        { day: '14', score: 92 },
    ]
};

export const AssessmentResult: React.FC<AssessmentResultProps> = ({ onFinish, onRetake, mode = 'initial', userName = 'Student' }) => {
  const [activeDimension, setActiveDimension] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);
  
  // Shadow Mode Toggle (Default on for review)
  const [showShadow, setShowShadow] = useState(mode === 'review');

  useEffect(() => {
    // Reveal content after mount
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const activeAnalysis = activeDimension 
    ? MOCK_DATA.radarData.find(d => d.subject === activeDimension) 
    : MOCK_DATA.radarData[1]; // Default to Logic (Index 1) for better visual

  return (
    <div className="absolute inset-0 z-[70] bg-gray-900 flex flex-col md:justify-center md:items-center md:p-8 overflow-hidden font-sans text-white">
      
      {/* Top Controls: Close & Share & Calibration */}
      <div className="absolute top-6 right-6 z-[110] flex gap-3">
          <button 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md border border-white/5"
            onClick={() => alert('Snapshot saved to gallery!')}
            title="保存快照"
          >
              <Share2 size={20} />
          </button>
          
          {mode === 'review' && (
              <>
                {onRetake && (
                    <button 
                        onClick={() => setShowRetakeConfirm(true)}
                        className="p-2 bg-brand/20 hover:bg-brand/30 rounded-full text-brand-light hover:text-white transition-colors backdrop-blur-md border border-brand/20 shadow-lg shadow-brand/10 group"
                        title="能力校准"
                    >
                        <Scan size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                )}
                <button 
                    onClick={onFinish}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md border border-white/5"
                >
                    <X size={20} />
                </button>
              </>
          )}
      </div>

      {/* --- Ambient Background --- */}
      <div className="absolute inset-0 pointer-events-none">
          {/* Moving Gradients */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]" 
          />
          {/* Tech Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* --- Main Dashboard Container (Bento Grid) --- */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full md:max-w-[1200px] h-full md:h-[85vh] bg-gray-800/40 backdrop-blur-2xl md:rounded-[40px] border-none md:border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden no-scrollbar scroll-smooth"
      >
          {/* Scan Line Effect (Desktop) */}
          {mode === 'initial' && (
            <motion.div 
                initial={{ top: -100 }}
                animate={{ top: '100%' }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 z-20 pointer-events-none hidden md:block"
            />
          )}

          {/* === COLUMN 1: IDENTITY (Left / Top) === */}
          <div className="w-full md:flex-[0.8] md:h-full border-b md:border-b-0 md:border-r border-white/5 p-6 md:p-8 flex flex-col relative overflow-hidden shrink-0">
              {/* Identity Header */}
              <div className="flex items-center justify-between mb-6 md:mb-8 opacity-80">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono tracking-widest uppercase">
                      <Cpu size={14} />
                      <span>Identity Verified</span>
                  </div>
                  {/* User Badge */}
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-brand to-cyan-400 flex items-center justify-center">
                          <User size={10} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-white/90">{userName}</span>
                  </div>
              </div>

              <div className="flex-1 flex flex-row md:flex-col items-center md:items-start gap-6 md:gap-0 justify-start md:justify-center">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={showContent ? { y: 0, opacity: 1 } : {}}
                    transition={{ delay: 0.2 }}
                    className="flex flex-row md:flex-col items-center md:items-start text-left gap-6 md:gap-0 w-full"
                  >
                      {/* 3D Icon Representation */}
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-[20px] md:rounded-[24px] bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center mb-0 md:mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-md relative group shrink-0">
                          <div className="absolute inset-0 bg-cyan-400/10 blur-xl group-hover:bg-cyan-400/20 transition-colors"></div>
                          <MOCK_DATA.archetype.icon size={32} className="text-cyan-300 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] relative z-10" />
                      </div>

                      <div className="flex-1">
                          <h2 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight">
                              {MOCK_DATA.archetype.title}
                          </h2>
                          <div className="h-1 w-12 bg-cyan-500 rounded-full mb-3 md:mb-6"></div>
                          
                          <p className="text-sm md:text-lg text-cyan-100 font-bold mb-2 md:mb-4 leading-tight">
                              "{MOCK_DATA.archetype.slogan}"
                          </p>
                          <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium hidden md:block">
                              {MOCK_DATA.archetype.desc}
                          </p>
                      </div>
                  </motion.div>
              </div>
              
              {/* Mobile Desc */}
              <p className="text-xs text-gray-400 leading-relaxed font-medium md:hidden mt-2 mb-2">
                  {MOCK_DATA.archetype.desc}
              </p>

              {/* Decorative Code */}
              <div className="mt-auto opacity-20 font-mono text-[10px] text-cyan-500 leading-tight hidden md:block">
                  <p>{`> ANALYSIS_COMPLETE`}</p>
                  <p>{`> OPTIMIZING_PATH...`}</p>
                  <p>{`> READY_TO_LAUNCH`}</p>
              </div>
          </div>

          {/* === COLUMN 2: CORE DATA (Middle) === */}
          <div className="w-full md:flex-[1.2] md:h-full border-b md:border-b-0 md:border-r border-white/5 p-6 md:p-8 flex flex-col relative bg-white/[0.02] shrink-0 min-h-[420px] md:min-h-0">
              <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                  <Activity size={120} className="text-white" strokeWidth={0.5} />
              </div>

              <div className="mb-4 z-10 flex justify-between items-start">
                  <div>
                      <h3 className="text-white text-lg font-bold flex items-center gap-2">
                          <Bot size={18} className="text-purple-400" />
                          多元智能图谱
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                          {activeDimension ? `已选中：${activeDimension}` : '点击维度查看详细分析'}
                      </p>
                  </div>
                  
                  {/* Legend for Shadow Mode */}
                  {mode === 'review' && (
                      <div className="flex flex-col gap-1 items-end">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span> 本次
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                              <span className="w-2 h-2 rounded-full border border-gray-500 border-dashed"></span> 上月
                          </div>
                      </div>
                  )}
              </div>

              {/* Chart Container */}
              <div className="flex-1 relative min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_DATA.radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                          <PolarAngleAxis 
                              dataKey="subject" 
                              tick={({ payload, x, y, textAnchor }) => (
                                  <g 
                                    className="cursor-pointer hover:opacity-100 opacity-60 transition-opacity"
                                    onClick={() => setActiveDimension(payload.value)}
                                  >
                                      <text x={x} y={y} textAnchor={textAnchor} fill={activeDimension === payload.value ? "#22D3EE" : "white"} fontSize={10} fontWeight="bold">
                                          {payload.value}
                                      </text>
                                  </g>
                              )} 
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          
                          {/* Shadow Radar (Previous) */}
                          {showShadow && (
                              <Radar
                                  name="Last Month"
                                  dataKey="prevScore"
                                  stroke="#6B7280"
                                  strokeWidth={1.5}
                                  strokeDasharray="4 4"
                                  fill="#6B7280"
                                  fillOpacity={0.1}
                              />
                          )}

                          {/* Current Radar */}
                          <Radar
                              name="Ability"
                              dataKey="score"
                              stroke="#8B5CF6"
                              strokeWidth={3}
                              fill="#8B5CF6"
                              fillOpacity={0.4}
                              isAnimationActive={true}
                          />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                              itemStyle={{ color: '#A78BFA', fontWeight: 'bold' }}
                          />
                      </RadarChart>
                  </ResponsiveContainer>

                  {/* Center Core */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              </div>

              {/* Mobile Dimension Tabs */}
              <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2 mt-2 -mx-2 px-2 mask-linear-fade">
                  {MOCK_DATA.radarData.map((item) => (
                      <button
                          key={item.subject}
                          onClick={() => setActiveDimension(item.subject)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                              activeDimension === item.subject 
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                                  : 'bg-white/5 text-gray-400 border-white/10'
                          }`}
                      >
                          {item.subject}
                      </button>
                  ))}
              </div>

              {/* Dynamic Analysis Box */}
              <AnimatePresence mode="wait">
                  <motion.div 
                      key={activeAnalysis?.subject}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 bg-gray-800/50 rounded-2xl p-4 border border-white/5 backdrop-blur-sm"
                  >
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-white">{activeAnalysis?.subject}智能</span>
                          <div className="flex items-center gap-3">
                              {mode === 'review' && activeAnalysis.score > activeAnalysis.prevScore && (
                                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                                      +{activeAnalysis.score - activeAnalysis.prevScore}
                                  </span>
                              )}
                              <span className="text-2xl font-black text-purple-400">{activeAnalysis?.score}</span>
                          </div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                          {activeAnalysis?.analysis}
                      </p>
                  </motion.div>
              </AnimatePresence>
          </div>

          {/* === COLUMN 3: STRATEGY (Right / Bottom) === */}
          <div className="w-full md:flex-1 md:h-full p-6 md:p-8 flex flex-col bg-gray-900/40 relative shrink-0 pb-32 md:pb-8">
              <div className="mb-8">
                  <h3 className="text-white text-lg font-bold flex items-center gap-2 mb-6">
                      <Sparkles size={18} className="text-yellow-400" />
                      AI 处方笺
                  </h3>
                  
                  {/* Prescription Cards */}
                  <div className="space-y-3">
                      {MOCK_DATA.prescription.map((item, idx) => (
                          <motion.div 
                              key={item.label}
                              initial={{ x: 20, opacity: 0 }}
                              animate={showContent ? { x: 0, opacity: 1 } : {}}
                              transition={{ delay: 0.4 + idx * 0.1 }}
                              className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:bg-white/10 transition-colors"
                          >
                              <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center ${item.color}`}>
                                  <item.icon size={20} />
                              </div>
                              <div>
                                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.label}</div>
                                  <div className="text-sm font-bold text-white">{item.value}</div>
                              </div>
                          </motion.div>
                      ))}
                  </div>
              </div>

              {/* Growth Projection */}
              <div className="flex-1 flex flex-col justify-end">
                  <div className="text-xs font-bold text-gray-500 mb-2 flex justify-between">
                      <span>成长预测 (14天)</span>
                      <span className="text-green-400">+18% 提升</span>
                  </div>
                  <div className="h-32 w-full bg-gray-800/30 rounded-xl border border-white/5 p-2 relative overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MOCK_DATA.projection}>
                              <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Desktop Button */}
              <div className="hidden md:block mt-6">
                  {mode === 'initial' && (
                      <motion.button 
                          onClick={onFinish}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-brand to-purple-600 hover:from-brand-light hover:to-purple-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 group relative overflow-hidden"
                      >
                          <span className="relative z-10">开启旅程</span>
                          <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                          <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out]"></div>
                      </motion.button>
                  )}
              </div>
          </div>

      </motion.div>

      {/* === MOBILE STICKY FOOTER (Outside Scroll Container) === */}
      {mode === 'initial' && (
        <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-[80] pointer-events-auto">
            <motion.button 
                onClick={onFinish}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-r from-brand to-purple-600 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
            >
                开启旅程 <ArrowRight size={20} />
            </motion.button>
        </div>
      )}

      {/* === Calibration Confirmation Modal === */}
      <AnimatePresence>
          {showRetakeConfirm && (
              <div className="absolute inset-0 z-[120] flex items-center justify-center p-6">
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setShowRetakeConfirm(false)}
                  />
                  <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 10 }}
                      className="bg-white rounded-[32px] p-6 shadow-2xl relative w-full max-w-sm text-center"
                  >
                      <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4 text-brand">
                          <Scan size={32} />
                      </div>
                      <h3 className="text-xl font-black text-gray-800 mb-2">启动能力校准？</h3>
                      <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                          小晤 将通过一组新的自适应测试，更新你的能力模型和推荐策略。<br/>
                          <span className="text-xs text-brand mt-1 block font-bold">预计耗时 5 分钟</span>
                      </p>
                      
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setShowRetakeConfirm(false)}
                              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                          >
                              暂不更新
                          </button>
                          <button 
                              onClick={() => {
                                  setShowRetakeConfirm(false);
                                  onRetake && onRetake();
                              }}
                              className="flex-1 py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/30"
                          >
                              开始校准
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};
