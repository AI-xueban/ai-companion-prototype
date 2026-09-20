
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, X, MessageSquare, Image as ImageIcon, Send, ChevronRight, Zap, Play, UploadCloud, Rocket, BookOpen, PenTool, Layout, ClipboardList, BarChart, History, ChevronLeft, ChevronDown, Sparkles, Check, Lock, Search, FileText, Lightbulb, UserCheck, AlertCircle, ShieldAlert, Target, Compass, ArrowUpRight, Mic, Presentation, FileVideo, Fingerprint, Award, TrendingUp, ShieldCheck, Scan, Cpu, Waves, Flame, Ghost, FileUp, Camera, Video, FileArchive, CheckCircle2, ArrowRight, Plus, UserPlus, Bell, UserMinus, ShieldQuestion, Users, MousePointer2, Trophy } from 'lucide-react';
import { PBLProject, PBLStep, PBLRole } from '../../types';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';
import { TeamFormationModal } from '../TeamFormation/TeamFormationModal';
import { useTeamFormation } from '../TeamFormation/useTeamFormation';

// --- MOCK DATA ---
const PROJECTS: PBLProject[] = [
    { 
        id: 'mars-colony', 
        title: '火星生态瓶设计', 
        subtitle: '设计一个可供 5 人生存的微型循环 system', 
        difficulty: 3, 
        tags: ['生物', '数学', '工程'], 
        mentor: { id: 'admin', name: 'Lumi', avatar: '🤖', role: '探险助手' }, 
        description: '你需要综合运用光合作用计算、体积几何与受力分析，打造人类的第二家园。', 
        totalSteps: 5, 
        themeColor: 'from-orange-500 to-red-600',
        rolePool: [
            { id: 'arch', title: '生命支持系统架构师', icon: '🏗️', desc: '负责舱体受力平衡与物理结构搭建。', subjectFocus: '工程' },
            { id: 'biol', title: '生物圈平衡守护者', icon: '🌿', desc: '监测物种能量流动与氧气循环效率。', subjectFocus: '生物' },
            { id: 'math', title: '资源配给首席精算师', icon: '🧮', desc: '精准计算生存物资消耗与生存周期。', subjectFocus: '数学' },
        ],
        discoveryPool: [
            { id: 'mars-d1', text: '1g 藻类在光照不足时的产氧率下降了 60%，人工补光是核心保障。', category: '科学探究' },
            { id: 'mars-d2', text: '密闭环境下的气压平衡点取决于精确的温差控制，而非单纯的排气。', category: '物理逻辑' },
            { id: 'mars-d3', text: '蜂窝状舱体结构在火星沙尘暴环境下的稳定性提升了 40%。', category: '工程思维' }
        ]
    },
    { 
        id: 'noise-detective', 
        title: '校园噪音侦探', 
        subtitle: '利用声学知识优化图书馆布局', 
        difficulty: 1, 
        tags: ['物理', '数据分析'], 
        mentor: { id: 'admin', name: 'Lumi', avatar: '🤖', role: '探险助手' }, 
        description: '带上你的分贝仪（App），绘制校园声场热力图，并给出降噪整改方案。', 
        totalSteps: 3, 
        themeColor: 'from-cyan-500 to-blue-600',
        rolePool: [
            { id: 'phys', title: '声学采样官', icon: '🎙️', desc: '负责校园各区域分贝数据的实地采集。', subjectFocus: '物理' },
            { id: 'dsgn', title: '校园环境规划师', icon: '📐', desc: '基于美学与功能设计降噪景观方案。', subjectFocus: '设计' },
            { id: 'stat', title: '噪音分布数据官', icon: '📈', desc: '生成热力分布图并进行统计学关联分析。', subjectFocus: '统计' },
        ],
        discoveryPool: [
            { id: 'noise-d1', text: '图书馆角落的吸音棉对 500Hz 以上的高频噪音吸收率最高，应优先布置。', category: '物理分析' },
            { id: 'noise-d2', text: '绿植对噪音的阻隔效果主要来源于其叶片的散射作用，而非简单的阻断。', category: '环境科学' },
            { id: 'noise-d3', text: '校园声场热力图显示，食堂区域的低频共振是主要的隐形成长噪音源。', category: '数据洞察' }
        ]
    },
    { 
        id: 'future-market', 
        title: '未来超市商业书', 
        subtitle: '为无人超市设计定价与会员策略', 
        difficulty: 2, 
        tags: ['数学', '逻辑'], 
        mentor: { id: 'admin', name: 'Lumi', avatar: '🤖', role: '探险助手' }, 
        description: '通过概率统计与折扣算法，在保证利润的同时最大化客流量。', 
        totalSteps: 4, 
        themeColor: 'from-purple-500 to-indigo-600',
        rolePool: [
            { id: 'econ', title: '价格博弈策略师', icon: '💸', desc: '设计促销算法，寻找利润与流量的平衡。', subjectFocus: '数学' },
            { id: 'psyc', title: '消费心理洞察员', icon: '🧠', desc: '分析货架动线与用户购买决策心理。', subjectFocus: '心理' },
            { id: 'oper', title: '数字化运营经理', icon: '📱', desc: '优化补货流程与无人收银系统的效率。', subjectFocus: '管理' },
        ],
        discoveryPool: [
            { id: 'market-d1', text: '通过概率统计发现，下午 4 点是校园会员消费欲望最高的窗口期。', category: '数学应用' },
            { id: 'market-d2', text: '无人柜台的动线设计直接影响了 15% 的客单价提升，空间布局即营销。', category: '逻辑工程' },
            { id: 'market-d3', text: '动态定价算法在保证 20% 利润率的同时，将库存周转率提升了 2 倍。', category: '商业思维' }
        ]
    }
];

const MOCK_RESOURCES = [
    { id: 'r1', title: '《封闭系统热力学指南》', type: 'doc', keywords: ['热力学', '封闭系统', '能量'], match: '98%' },
    { id: 'r2', title: '火星大气成分分析报告', type: 'video', keywords: ['火星', '大气', '氧气'], match: '95%' },
    { id: 'r3', title: '植物根系水分回收模型', type: 'doc', keywords: ['植物', '水分', '回收'], match: '92%' },
    { id: 'r4', title: '微型重力模拟算法', type: 'code', keywords: ['重力', '算法', '模拟'], match: '89%' }
];

// --- Context for PBL State Management ---
interface PBLContextType {
    currentStep: PBLStep;
    setCurrentStep: (step: PBLStep) => void;
    activeProject: PBLProject | null;
    isToolboxOpen: boolean;
    setToolboxOpen: (open: boolean) => void;
    selectedRole: string | null;
    setSelectedRole: (role: string | null) => void;
    kwlQuestions: string[];
    setKwlQuestions: (q: string[]) => void;
    lumiEmotion: any;
    setLumiEmotion: (e: any) => void;
    isAuditing: boolean;
    setAuditing: (a: boolean) => void;
    showSpiralPortal: boolean;
    setShowSpiralPortal: (s: boolean) => void;
    onClosePBL: () => void;
    canvasScrollRef: React.RefObject<HTMLDivElement | null>;
}

const PBLContext = createContext<PBLContextType | undefined>(undefined);

const usePBL = () => {
    const context = useContext(PBLContext);
    if (!context) throw new Error('usePBL must be used within a PBLProvider');
    return context;
};

// --- COMPONENTS ---

export const PBLFloatingEntry: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <div className="absolute bottom-28 left-6 z-30 pointer-events-auto">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button onClick={onClick} className="relative flex items-center gap-3 px-5 py-3 bg-white/90 backdrop-blur-xl border border-white/60 rounded-full leading-none overflow-hidden transition-transform active:scale-95 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
                    <div className="relative z-10 flex items-center gap-2">
                        <div className="relative bg-gradient-to-br from-cyan-500 to-fuchsia-500 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm">
                            <Atom size={16} className="animate-spin-slow" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-gray-800 font-black text-sm tracking-wider">创新工坊</span>
                            <span className="text-[9px] text-fuchsia-500 font-mono tracking-widest font-bold">LUMI LAB</span>
                        </div>
                    </div>
                </button>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce shadow-sm"></div>
            </div>
        </div>
    );
};

export interface PBLContainerProps {
    isOpen: boolean;
    onClose: () => void;
    debugStep?: PBLStep | null;
    debugAuditing?: boolean;
    debugSpiral?: boolean;
    resetTrigger?: number;
}

export const PBLContainer: React.FC<PBLContainerProps> = ({ isOpen, onClose, debugStep, debugAuditing, debugSpiral, resetTrigger }) => {
    const [view, setView] = useState<'market' | 'workbench'>('market');
    const [activeProject, setActiveProject] = useState<PBLProject | null>(null);
    const [currentStep, setCurrentStep] = useState<PBLStep>('launch');
    const [isToolboxOpen, setToolboxOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [kwlQuestions, setKwlQuestions] = useState<string[]>(['', '', '']);
    const [lumiEmotion, setLumiEmotion] = useState<'idle' | 'happy' | 'analyzing' | 'thinking' | 'breathing'>('idle');
    const [isAuditing, setAuditing] = useState(false);
    const [showSpiralPortal, setShowSpiralPortal] = useState(false);
    const canvasScrollRef = useRef<HTMLDivElement>(null);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalTarget(
            document.getElementById('app-viewport') ||
            document.getElementById('modal-root') ||
            null
        );
    }, []);

    // Sync with Debug Props
    useEffect(() => {
        if (debugStep) {
            setCurrentStep(debugStep);
            if (debugStep !== 'launch') setView('workbench');
            if (activeProject === null) setActiveProject(PROJECTS[0]);
            if (selectedRole === null) setSelectedRole('arch');
        }
    }, [debugStep]);

    useEffect(() => {
        if (debugAuditing !== undefined) setAuditing(debugAuditing);
    }, [debugAuditing]);

    useEffect(() => {
        if (debugSpiral !== undefined) setShowSpiralPortal(debugSpiral);
    }, [debugSpiral]);

    // Handle Reset
    useEffect(() => {
        if (resetTrigger) {
            setView('market');
            setActiveProject(null);
            setCurrentStep('launch');
            setAuditing(false);
            setShowSpiralPortal(false);
            setSelectedRole(null);
            setKwlQuestions(['', '', '']);
        }
    }, [resetTrigger]);

    const handleStartProject = (project: PBLProject) => { 
        setActiveProject(project); 
        setView('workbench'); 
        setCurrentStep('launch');
        setSelectedRole(null);
        setKwlQuestions(['', '', '']);
        setAuditing(false);
        setShowSpiralPortal(false);
    };

    if (!portalTarget) return null;

    const contextValue: PBLContextType = {
        currentStep,
        setCurrentStep,
        activeProject,
        isToolboxOpen,
        setToolboxOpen,
        selectedRole,
        setSelectedRole,
        kwlQuestions,
        setKwlQuestions,
        lumiEmotion,
        setLumiEmotion,
        isAuditing,
        setAuditing,
        showSpiralPortal,
        setShowSpiralPortal,
        onClosePBL: onClose,
        canvasScrollRef
    };

    return createPortal(
        <PBLContext.Provider value={contextValue}>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/80 backdrop-blur-md z-[90] pointer-events-auto" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="absolute inset-0 bg-[#0f1115] z-[100] flex flex-col overflow-hidden pointer-events-auto">
                            {view === 'market' ? (
                                <ProjectMarketplace onSelect={handleStartProject} onClose={onClose} />
                            ) : (
                                <PBLWorkbench onExit={() => setView('market')} />
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </PBLContext.Provider>,
        portalTarget
    );
};

const ProjectMarketplace: React.FC<{ onSelect: (p: PBLProject) => void, onClose: () => void }> = ({ onSelect, onClose }) => (
    <div className="w-full h-full flex flex-col">
        <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-[#15181e] shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg"><Atom className="text-white" size={18} /></div>
                <h2 className="text-white font-black text-lg tracking-wide">LUMI 创新工坊</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-100">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-white mb-2">本月精选课题</h3>
                    <p className="text-slate-400 text-sm">挑战现实世界难题，赚取稀有徽章与大量 XP。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PROJECTS.map((project) => (
                        <motion.div key={project.id} whileHover={{ y: -5 }} className="bg-[#1A1D26] ring-1 ring-inset ring-white/10 border border-white/5 rounded-3xl overflow-hidden shadow-xl group cursor-pointer flex flex-col h-full" onClick={() => onSelect(project)}>
                            <div className={`h-32 bg-gradient-to-br ${project.themeColor} relative p-6 flex items-center justify-between`}>
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                <div className="text-white opacity-20 absolute top-[-20px] right-[-20px]"><Zap size={100} /></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-1 mb-2">{[...Array(project.difficulty)].map((_, i) => <Zap key={i} size={12} className="text-yellow-300 fill-yellow-300" />)}</div>
                                    <div className="flex flex-wrap gap-2">{project.tags.map(tag => <span key={tag} className="text-[10px] bg-black/30 backdrop-blur-sm text-white px-2 py-0.5 rounded border border-white/10">{tag}</span>)}</div>
                                </div>
                                <div className="relative z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg">{project.mentor.avatar}</div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h4 className="text-white font-bold text-lg mb-1 group-hover:text-cyan-400 transition-colors">{project.title}</h4>
                                <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">{project.subtitle}</p>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2"><span className="text-slate-500 text-xs font-bold">实验室状态:</span><span className="text-slate-300 text-xs">实时探究中</span></div>
                                    <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-cyan-500 transition-colors"><Play size={14} fill="currentColor" /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// --- PBL WORKBENCH ---

const PBLWorkbench: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const { isToolboxOpen, setToolboxOpen, isAuditing, currentStep, canvasScrollRef } = usePBL();
    const isReflection = currentStep === 'reflection';
    const workbenchRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={workbenchRef} className={`w-full h-full flex overflow-hidden transition-all duration-1000 relative ${isAuditing ? 'bg-indigo-950/40' : 'bg-[#0a0c10]'}`}>
            {/* 1. LEFT: Lifecycle Sidebar - Hiden during reflection */}
            {!isReflection && (
                <LifecycleSidebar onExit={onExit} />
            )}

            {/* 2. CENTER: Task Canvas (With scroll ref) */}
            <main className={`flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-700 ${isReflection ? 'blur-xl grayscale opacity-10 scale-[0.98] origin-left pointer-events-none' : ''}`}>
                <WorkbenchHeader />
                <div ref={canvasScrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <WorkbenchCanvas />
                </div>
            </main>

            {/* 3. RIGHT: Toolbox or Reflection Overlay */}
            <AnimatePresence>
                {isToolboxOpen && !isReflection && (
                    <ToolboxDrawer onClose={() => setToolboxOpen(false)} />
                )}
                {isReflection && (
                    <ReflectionDrawer key="reflection-drawer" />
                )}
            </AnimatePresence>

            {!isToolboxOpen && !isReflection && (
                <button 
                    onClick={() => setToolboxOpen(true)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 w-12 h-24 bg-white/5 backdrop-blur-xl ring-1 ring-inset ring-white/10 rounded-full flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-white transition-all hover:bg-white/10 z-20"
                >
                    <ChevronLeft size={20} />
                    <div className="h-10 flex flex-col justify-between items-center py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                    </div>
                </button>
            )}
        </div>
    );
};

const LifecycleSidebar: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const { currentStep, setCurrentStep } = usePBL();
    const steps: { id: PBLStep, icon: any, label: string }[] = [
        { id: 'launch', icon: Rocket, label: '选定身份' },
        { id: 'knowledge', icon: BookOpen, label: '发现情报' },
        { id: 'practice', icon: Zap, label: '动手尝试' },
        { id: 'showcase', icon: Layout, label: '我的舞台' },
        { id: 'reflection', icon: History, label: '成长印记' }
    ];

    return (
        <aside className="w-16 md:w-20 border-r border-white/5 flex flex-col items-center py-6 bg-[#0f1115] shrink-0 z-20">
            <button onClick={onExit} className="mb-10 text-slate-500 hover:text-white transition-colors">
                <ChevronLeft size={24} />
            </button>
            <nav className="flex-1 flex flex-col gap-6">
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    return (
                        <button 
                            key={step.id} 
                            onClick={() => setCurrentStep(step.id)}
                            className="group relative flex flex-col items-center gap-1"
                        >
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-110' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
                                <step.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[9px] font-bold text-center leading-tight transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                {step.label}
                            </span>
                            {isActive && <motion.div layoutId="pbl-active-dot" className="absolute -left-0 w-1 h-6 bg-cyan-400 rounded-r-full top-3" />}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

const WorkbenchHeader: React.FC = () => {
    const { activeProject, isAuditing, currentStep } = usePBL();
    const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
    
    // Team Formation Logic
    const teamLogic = useTeamFormation();
    const { userStatus, currentSquad } = teamLogic;

    const getButtonText = () => {
        if (userStatus === 'IDLE') return '寻找队友';
        if (userStatus === 'FORMING') return `组建中 (${currentSquad?.members.length || 0}/4)`;
        if (userStatus === 'LOCKED') return `${currentSquad?.name}`;
        return '2 位伙伴';
    };

    return (
        <header className={`h-16 px-8 border-b transition-all duration-1000 flex items-center justify-between shrink-0 backdrop-blur-md z-20 ${isAuditing ? 'bg-indigo-950/60 border-indigo-400/30 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' : 'bg-[#0f1115]/50 border-white/5'}`}>
            <div className="flex items-center gap-4">
                <span className={`text-[10px] font-black px-2 py-1 rounded tracking-widest uppercase transition-all ${isAuditing ? 'text-amber-400 bg-amber-400/10' : 'text-cyan-400 bg-cyan-400/10'}`}>
                    {isAuditing ? 'AI 正在陪练' : (currentStep === 'reflection' ? '成长印记' : '探险地图')}
                </span>
                <h1 className="text-white font-bold text-lg">{activeProject?.title}</h1>
            </div>
            <div className="flex items-center gap-3 relative">
                {isAuditing && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-200 rounded-full text-[10px] font-black border border-indigo-500/30">
                        <Cpu size={12} className="animate-pulse" /> 协同逻辑校验中
                    </motion.div>
                )}
                
                {/* INTERACTIVE TEAMMATE INDICATOR */}
                <button 
                    onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                    className={`flex items-center gap-1 hover:bg-white/10 ring-1 ring-inset ring-white/10 px-3 py-1.5 rounded-full border border-white/5 transition-all active:scale-95 ${
                        userStatus === 'LOCKED' ? 'bg-indigo-600/20 ring-indigo-500/50 text-indigo-300' : 'bg-white/5'
                    }`}
                >
                    <div className="flex -space-x-1.5">
                        {currentSquad 
                            ? currentSquad.members.slice(0,3).map((m, i) => (
                                <img key={i} src={m.avatar} className="w-5 h-5 rounded-full border border-white/10 object-cover" alt="avatar" />
                            ))
                            : ['👩‍🚀', '👨‍🚀'].map((e, i) => <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px]">{e}</div>)
                        }
                    </div>
                    <span className="text-[10px] text-slate-300 font-bold ml-1">{getButtonText()}</span>
                    <ChevronDown size={12} className={`text-slate-500 transition-transform ${isTeamMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isTeamMenuOpen && (
                        <TeamFormationModal 
                            onClose={() => setIsTeamMenuOpen(false)} 
                            {...teamLogic}
                        />
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};


const WorkbenchCanvas: React.FC = () => {
    const { currentStep } = usePBL();

    return (
        <div className={`w-full h-full relative p-8 max-w-5xl mx-auto`}>
            <AnimatePresence mode="wait">
                {currentStep === 'launch' && <div id="pbl-section-launch"><LaunchStep key="launch" /></div>}
                {currentStep === 'knowledge' && <div id="pbl-section-knowledge"><KnowledgeStep key="knowledge" /></div>}
                {currentStep === 'practice' && <div id="pbl-section-practice"><PracticeStep key="practice" /></div>}
                {currentStep === 'showcase' && <div id="pbl-section-showcase"><ShowcaseStep key="showcase" /></div>}
                {currentStep === 'reflection' && <div className="h-full flex items-center justify-center"><p className="text-slate-500 font-bold italic">报告生成中，请在右侧查看...</p></div>}
            </AnimatePresence>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const TracePoint: React.FC<{ icon: any, color: string, onClick: () => void }> = ({ icon: Icon, color, onClick }) => (
    <motion.button 
        whileHover={{ scale: 1.2 }} onClick={onClick}
        className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${color} transition-all hover:bg-white/10 shadow-lg`}
    >
        <Icon size={16} />
    </motion.button>
);

const InteractiveRubric: React.FC<{ scores?: number[] }> = ({ scores: initialScores }) => {
    const [scores, setScores] = useState(initialScores || [70, 60, 80, 50, 65]);
    const labels = ['科学性', '工程感', '协作力', '表达力', '完整度'];

    const handleDrag = (idx: number, e: any, info: any) => {
        const delta = -info.delta.y / 2; 
        setScores(prev => {
            const next = [...prev];
            next[idx] = Math.min(100, Math.max(0, next[idx] + delta));
            return next;
        });
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg width="180" height="180" viewBox="0 0 200 200" className="overflow-visible">
                    <circle cx="100" cy="100" r={80} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r={40} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="4 4" />
                    <path 
                        d={labels.map((_, i) => {
                            const angle = (i * 2 * Math.PI) / labels.length - Math.PI / 2;
                            const r = (scores[i] / 100) * 80;
                            return `${i === 0 ? 'M' : 'L'} ${100 + r * Math.cos(angle)} ${100 + r * Math.sin(angle)}`;
                        }).join(' ') + ' Z'}
                        fill="rgba(6,182,212,0.2)"
                        stroke="#06b2d2"
                        strokeWidth="2"
                    />
                </svg>
                {labels.map((label, i) => {
                    const angle = (i * 2 * Math.PI) / labels.length - Math.PI / 2;
                    const r = (scores[i] / 100) * 80;
                    return (
                        <motion.div 
                            key={i}
                            drag="y"
                            dragConstraints={{ top: -80, bottom: 80 }}
                            onDrag={(e, info) => handleDrag(i, e, info)}
                            style={{ 
                                left: 100 + r * Math.cos(angle) - 6, 
                                top: 100 + r * Math.sin(angle) - 6,
                                position: 'absolute'
                            }}
                            className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] cursor-ns-resize z-20"
                        />
                    );
                })}
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
                {labels.map((l, i) => (
                    <div key={l} className="flex justify-between items-center bg-white/5 rounded-lg p-2 border border-white/5">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{l}</span>
                        <span className="text-[10px] font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{Math.round(scores[i])}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- STEP COMPONENTS ---

const LaunchStep: React.FC = () => {
    const { selectedRole, setSelectedRole, activeProject, setCurrentStep, lumiEmotion, setLumiEmotion } = usePBL();

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId);
        setLumiEmotion('analyzing');
        setTimeout(() => setLumiEmotion('happy'), 1500);
    };

    const roles = activeProject?.rolePool || [];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 ring-1 ring-inset ring-white/10 p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-fuchsia-500/5 pointer-events-none"></div>
                <div className="shrink-0 relative">
                    <InteractiveLumi size="lg" variant="hero" emotion={lumiEmotion} />
                    <AnimatePresence>
                        {selectedRole && (
                            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute -top-2 -right-2 bg-green-500 p-2 rounded-full border-4 border-[#15181e] shadow-xl">
                                <UserCheck size={20} className="text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <h2 className="text-3xl font-black text-white leading-tight">欢迎加入，探险家！</h2>
                    <p className="text-slate-200 text-lg leading-relaxed">
                        在开启「{activeProject?.title}」之前，我们需要确认你的机组成员身份。这将决定你在协作系统中的权限与工具集。
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map((role) => {
                    const isSelected = selectedRole === role.id;
                    // Simulate "Role Taken" logic (Only for visual feedback, not blocking in this single-user prototype)
                    const isTakenByOther = false; 

                    return (
                        <motion.button
                            key={role.id}
                            whileHover={!isTakenByOther ? { scale: 1.05, y: -5 } : {}}
                            whileTap={!isTakenByOther ? { scale: 0.98 } : {}}
                            onClick={() => !isTakenByOther && handleRoleSelect(role.id)}
                            className={`p-6 rounded-[32px] border-2 ring-1 ring-inset ring-white/10 text-left transition-all relative overflow-hidden group 
                                ${isSelected 
                                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.3)] ring-cyan-400/50' 
                                    : isTakenByOther 
                                        ? 'bg-white/5 border-white/5 opacity-50 grayscale cursor-not-allowed'
                                        : 'bg-white/5 backdrop-blur-md border-white/10 hover:border-white/30 hover:bg-white/10'
                                }`}
                        >
                            {/* Card Bevel Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none"></div>
                            
                            <div className={`text-4xl mb-4 transition-transform duration-500 ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>{role.icon}</div>
                            
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className={`text-lg font-black tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-200'}`}>{role.title}</h3>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    {role.subjectFocus}
                                </span>
                            </div>

                            <p className={`text-xs leading-relaxed transition-colors ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{role.desc}</p>
                            
                            {/* Selection Overlays */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center text-slate-900 shadow-lg"
                                    >
                                        <Check size={18} strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Decorative Edge Glow */}
                            {isSelected && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                            )}
                        </motion.button>
                    )
                })}
            </div>

            <div className="flex justify-center pt-8">
                <button 
                    onClick={() => setCurrentStep('knowledge')}
                    disabled={!selectedRole}
                    className={`px-12 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-2xl ${selectedRole ? 'bg-white text-slate-900 shadow-white/20 hover:scale-105 active:scale-95' : 'bg-white/10 text-slate-600 grayscale cursor-not-allowed'}`}
                >
                    确认身份并登舰 <ChevronRight size={20} strokeWidth={3} />
                </button>
            </div>
        </motion.div>
    );
};

const KnowledgeStep: React.FC = () => {
    const { kwlQuestions, setKwlQuestions, setCurrentStep, lumiEmotion, setLumiEmotion } = usePBL();
    const [isMatching, setIsMatching] = useState(false);
    const [matchFinished, setMatchFinished] = useState(false);

    useEffect(() => {
        const filled = kwlQuestions.filter(q => q.trim().length > 3).length;
        if (filled >= 3 && !matchFinished && !isMatching) {
            triggerMatch();
        }
    }, [kwlQuestions]);

    const triggerMatch = () => {
        setIsMatching(true);
        setLumiEmotion('analyzing');
        setTimeout(() => {
            setIsMatching(false);
            setMatchFinished(true);
            setLumiEmotion('happy');
        }, 2500);
    };

    const handleInputChange = (idx: number, val: string) => {
        const newQs = [...kwlQuestions];
        newQs[idx] = val;
        setKwlQuestions(newQs);
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 pb-32">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white">探索发现页</h2>
                    <p className="text-slate-400 text-sm mt-1 tracking-wide uppercase font-black">Discovery Map (What I Want to Learn)</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 ring-1 ring-inset ring-white/10 px-4 py-2 rounded-full border border-white/5">
                    <Lightbulb size={16} className="text-yellow-400" />
                    <span className="text-xs font-bold text-slate-200">已获得 {kwlQuestions.filter(q => q.trim().length > 3).length}/3 个探索点</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map(i => (
                    <motion.div key={i} layout className="bg-white/5 ring-1 ring-inset ring-white/10 border border-white/10 rounded-[32px] p-6 focus-within:border-cyan-500/50 transition-colors shadow-xl">
                        <div className="flex items-center gap-2 mb-4 text-cyan-400">
                            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center font-black text-sm">?</div>
                            <span className="text-xs font-black uppercase tracking-wider">我的小问号 {i+1}</span>
                        </div>
                        <textarea 
                            value={kwlQuestions[i]}
                            onChange={(e) => handleInputChange(i, e.target.value)}
                            placeholder="我想要发现..."
                            className="w-full h-32 bg-transparent text-white font-bold text-lg resize-none outline-none placeholder:text-slate-700 leading-relaxed"
                        />
                    </motion.div>
                ))}
            </div>

            <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Zap size={20} className="text-fuchsia-500" /> 对应情报站
                    </h3>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="relative rounded-[40px] overflow-hidden min-h-[300px]">
                    <AnimatePresence>
                        {(!matchFinished || isMatching) && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center border border-white/5 rounded-[40px]"
                            >
                                {isMatching ? (
                                    <div className="flex flex-col items-center">
                                        <InteractiveLumi size="md" variant="standard" emotion="analyzing" />
                                        <h4 className="text-xl font-black text-white mt-6 mb-2">情报匹配中...</h4>
                                        <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                                            <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1/2 h-full bg-cyan-400" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-white/5 ring-1 ring-inset ring-white/10 rounded-full flex items-center justify-center mb-6 border border-white/10 group">
                                            <Lock size={32} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                        <h4 className="text-xl font-black text-white mb-2">情报库已锁定</h4>
                                        <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
                                            为了精准匹配你的问题，请先在上方确定 <span className="text-cyan-400 font-bold">3 个想研究的内容</span>。
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 ${(!matchFinished || isMatching) ? 'blur-xl grayscale opacity-50' : 'opacity-100'}`}>
                        {MOCK_RESOURCES.map(res => (
                            <div key={res.id} className="bg-white/5 ring-1 ring-inset ring-white/10 border border-white/5 rounded-3xl p-5 flex items-center gap-4 group hover:bg-white/10 transition-colors relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3">
                                    <span className="text-[9px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">匹配度 {res.match}</span>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-[#1A1D26] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                                    {res.type === 'doc' ? <FileText size={24} /> : res.type === 'video' ? <Play size={24} /> : <Search size={24} />}
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-white font-bold mb-1">{res.title}</h5>
                                    <div className="flex gap-2">
                                        {res.keywords.map(k => <span key={k} className="text-[10px] font-bold text-slate-400 bg-black/30 px-1.5 py-0.5 rounded">#{k}</span>)}
                                    </div>
                                </div>
                                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-cyan-500 transition-all">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {matchFinished && !isMatching && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center pt-10">
                    <button 
                        onClick={() => setCurrentStep('practice')}
                        className="px-12 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                    >
                        开启动手尝试 <Zap size={20} fill="currentColor" />
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};

const PracticeStep: React.FC = () => {
    const { isAuditing, setAuditing, lumiEmotion, setLumiEmotion, setCurrentStep, showSpiralPortal, setShowSpiralPortal, activeProject } = usePBL();
    const [lastActionTime, setLastActionTime] = useState(Date.now());
    const [isScanning, setIsScanning] = useState(false);
    const [userDefense, setUserDefense] = useState('');
    const [messages, setMessages] = useState<{sender: 'ai'|'user', text: string}[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const idleTime = Date.now() - lastActionTime;
            if (idleTime > 15000 && !isAuditing && !showSpiralPortal && !isScanning) {
                setShowSpiralPortal(true);
                setLumiEmotion('thinking');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastActionTime, isAuditing, showSpiralPortal, isScanning]);

    const handleActivity = () => {
        setLastActionTime(Date.now());
        if (showSpiralPortal) {
            setShowSpiralPortal(false);
            setLumiEmotion('happy');
        }
    };

    const triggerAudit = () => {
        setIsScanning(true);
        setLumiEmotion('analyzing');
        
        setTimeout(() => {
            setIsScanning(false);
            setAuditing(true);
            setLumiEmotion('thinking');
            setMessages([
                { sender: 'ai', text: '正在通过逻辑防线扫描你的模型参数...' },
                { sender: 'ai', text: '扫描完成。我发现了一个有趣的逻辑冲突：在低重力模拟下，你的氧气循环冗余度只有 5%，而按照物理常数，至少需要 15% 才能应对突发泄露。' },
                { sender: 'ai', text: '你能向我展示，你是如何处理这一层潜在的安全防线的吗？' }
            ]);
        }, 2500);
    };

    const handleSendDefense = () => {
        if (!userDefense.trim()) return;
        const text = userDefense.trim();
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setUserDefense('');
        setLumiEmotion('thinking');
        
        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'ai', text: '非常有意思的补充逻辑。通过引入辅助光合作用单元来覆盖损耗差值... 逻辑防线加固完成！' }]);
            setLumiEmotion('happy');
            setTimeout(() => {
                setAuditing(false);
                setCurrentStep('showcase');
            }, 3000);
        }, 2000);
    };

    return (
        <div className="h-full flex flex-col pb-20" onClick={handleActivity}>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <PenTool size={16} className="text-cyan-400" /> 我的设计草稿
                        </h3>
                        <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Drafting
                        </div>
                    </div>
                    
                    <div className={`bg-white/5 ring-1 ring-inset ring-white/10 border border-white/10 rounded-[32px] aspect-square relative overflow-hidden group shadow-2xl transition-all duration-700 ${isScanning ? 'ring-indigo-500/50 scale-[0.98]' : ''}`}>
                        {/* 4.1 COLLABORATIVE CURSORS FOOTPRINTS */}
                        {!isScanning && (
                            <>
                                <CollaborativeCursor roleName={activeProject?.rolePool[1]?.title || '队友'} color="rgb(34, 211, 238)" />
                                <CollaborativeCursor roleName={activeProject?.rolePool[2]?.title || '队友'} color="rgb(167, 139, 250)" />
                            </>
                        )}

                        <AnimatePresence>
                            {isScanning && (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[2px]"></div>
                                    <motion.div 
                                        animate={{ top: ['-20%', '120%'] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-[20%] bg-gradient-to-b from-transparent via-indigo-400 to-transparent opacity-40 shadow-[0_0_30px_rgba(129,140,248,0.5)]"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Scan size={64} className="text-indigo-400 animate-pulse mb-4" />
                                        <span className="text-xs font-black text-indigo-200 tracking-[0.3em] uppercase">Deep Scan Active</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')] opacity-5 group-hover:scale-110 transition-transform duration-[10s]"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                            {!isAuditing && !isScanning ? (
                                <>
                                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-cyan-500/30 flex items-center justify-center mb-6 animate-spin-slow">
                                        <Atom size={64} className="text-cyan-500/50" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">点击此处上传你的模型或受力分析图</p>
                                    <button onClick={triggerAudit} className="mt-8 px-6 py-3 bg-white/5 ring-1 ring-inset ring-white/10 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                        <UploadCloud size={16} /> 开启 AI 逻辑闯关 (Submit)
                                    </button>
                                </>
                            ) : isAuditing ? (
                                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-20 animate-pulse"></div>
                                        <ShieldCheck size={80} className="text-indigo-400 mb-6 drop-shadow-[0_0_20px_rgba(129,140,248,0.4)]" />
                                    </div>
                                    <h4 className="text-indigo-200 font-black text-xl mb-2">AI 正在陪练中</h4>
                                    <p className="text-slate-400 text-xs">正在协助优化设计冗余度...</p>
                                </motion.div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className={`flex flex-col h-[500px] rounded-[32px] ring-1 ring-inset ring-white/10 border transition-all duration-1000 overflow-hidden relative shadow-2xl ${isAuditing ? 'bg-indigo-950/20 border-indigo-400/40' : 'bg-white/5 border-white/10 opacity-60 grayscale'}`}>
                    <div className="absolute inset-0 bg-black/20 pointer-events-none z-0"></div>
                    <div className={`p-5 border-b flex justify-between items-center shrink-0 z-10 ${isAuditing ? 'border-indigo-400/20 bg-indigo-950/10 backdrop-blur-md' : 'border-white/5'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all ${isAuditing ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`}>
                                <InteractiveLumi size="xs" variant="micro" emotion={lumiEmotion} />
                            </div>
                            <div>
                                <h4 className={`text-sm font-black transition-colors ${isAuditing ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {isAuditing ? 'Lumi 逻辑陪练' : '安全监控助手'}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Socratic Logic Challenge</p>
                            </div>
                        </div>
                        {isAuditing && <Sparkles size={16} className="text-amber-400 animate-pulse" />}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar z-10 relative">
                        {messages.length === 0 && !isScanning ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                <MessageSquare size={32} className="text-slate-500 mb-2" />
                                <p className="text-xs font-bold">待提交设计模型</p>
                            </div>
                        ) : isScanning ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
                                <p className="text-xs font-bold text-indigo-300">正在解析几何参数...</p>
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`px-4 py-3 rounded-2xl max-w-[90%] text-sm font-medium leading-relaxed shadow-sm ${m.sender === 'ai' ? 'bg-indigo-950/60 text-indigo-50 border border-indigo-400/20 rounded-tl-none backdrop-blur-md' : 'bg-white text-gray-900 rounded-tr-none shadow-xl'}`}>
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className={`p-4 border-t transition-colors z-10 ${isAuditing ? 'bg-indigo-950/40 border-indigo-400/20' : 'bg-white/5 border-white/5'}`}>
                        <div className="relative flex items-center gap-3">
                            <input 
                                value={userDefense}
                                onChange={(e) => setUserDefense(e.target.value)}
                                disabled={!isAuditing}
                                placeholder={isAuditing ? "阐述你的优化逻辑..." : "设计提交后开启对话"}
                                className="flex-1 bg-black/40 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 font-medium"
                            />
                            <button 
                                onClick={handleSendDefense}
                                disabled={!isAuditing || !userDefense.trim()}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isAuditing ? 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 font-black' : 'bg-white/5 text-slate-700'}`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showSpiralPortal && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm z-30"
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
                            <div className="bg-slate-900 rounded-[20px] p-5 flex flex-col gap-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Compass size={80} className="animate-spin-slow" />
                                </div>
                                <div className="flex gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-black text-sm mb-1">遇到卡点了吗？</h4>
                                        <p className="text-slate-400 text-[11px] leading-relaxed">
                                            检测到长时间未操作。需要回到 <span className="text-blue-400 font-bold">发现情报</span> 重新核对物理参数吗？
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 relative z-10">
                                    <button onClick={() => setShowSpiralPortal(false)} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-white/5 transition-colors">
                                        继续尝试
                                    </button>
                                    <button onClick={() => setCurrentStep('knowledge')} className="flex-[2] bg-blue-600 text-white py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                        <ArrowUpRight size={14} /> 跳转至情报站
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// 4.1 HELPER: Collaborative Cursor Simulation
const CollaborativeCursor: React.FC<{ roleName: string, color: string }> = ({ roleName, color }) => {
    return (
        <motion.div 
            animate={{ 
                x: [Math.random() * 300, Math.random() * 300, Math.random() * 300],
                y: [Math.random() * 300, Math.random() * 300, Math.random() * 300],
                opacity: [0, 1, 1, 0.5, 1, 0]
            }}
            transition={{ duration: 10 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
            className="absolute z-20 pointer-events-none"
        >
            <div className="relative">
                <MousePointer2 size={16} fill={color} stroke="white" strokeWidth={2} />
                <div 
                    style={{ backgroundColor: color }}
                    className="ml-4 -mt-1 px-2 py-0.5 rounded-full text-[8px] font-black text-white shadow-lg whitespace-nowrap"
                >
                    {roleName}
                </div>
            </div>
        </motion.div>
    );
};

const ShowcaseStep: React.FC = () => {
    const { setCurrentStep, setLumiEmotion } = usePBL();
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'finished'>('idle');
    const [feedbackMsg, setFeedbackMsg] = useState('');

    const handleUpload = (type: string) => {
        setUploadStatus('uploading');
        setLumiEmotion('analyzing');
        setTimeout(() => {
            setUploadStatus('finished');
            setLumiEmotion('happy');
            const msgs = [
                "哇！你的受力分析图画得真专业，如果能在解说里提到‘稳定性’就更棒了！",
                "这个模型很巧妙！我注意到你对‘氧气冗余’的处理非常超前。",
                "太棒了！你的作品已经同步到云端，看来你已经准备好最后的复盘了。"
            ];
            const chosenMsg = msgs[Math.floor(Math.random() * msgs.length)];
            setFeedbackMsg(chosenMsg);
        }, 3000);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-white">我的成果发布会</h2>
                <p className="text-slate-400 max-w-lg mx-auto">准备好向世界展示你的发现了吗？上传你的作品，Lumi 将作为你的第一位观众。</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {uploadStatus === 'idle' ? (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <UploadCard icon={Camera} title="我的海报/手绘" color="text-pink-400" bg="bg-pink-400/10" onClick={() => handleUpload('image')} />
                            <UploadCard icon={Video} title="我的实战解说" color="text-blue-400" bg="bg-blue-400/10" onClick={() => handleUpload('video')} />
                            <UploadCard icon={FileArchive} title="我的全量文档" color="text-orange-400" bg="bg-orange-400/10" onClick={() => handleUpload('file')} />
                        </motion.div>
                    ) : uploadStatus === 'uploading' ? (
                        <motion.div key="uploading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-[40px] p-16 flex flex-col items-center gap-8 shadow-2xl">
                            <div className="relative">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-24 h-24 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full" />
                                <div className="absolute inset-0 flex items-center justify-center text-cyan-400"><FileUp size={32} /></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-white mb-2">正在接收作品数据...</h3>
                                <p className="text-slate-500 text-sm">正在构建 3D 预览图并提取逻辑摘要</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <div className="bg-white/5 border-2 border-green-500/30 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><CheckCircle2 size={120} className="text-green-500" /></div>
                                <div className="w-40 h-40 bg-[#1A1D26] rounded-3xl border border-white/5 flex items-center justify-center text-slate-500 relative group overflow-hidden">
                                    <ImageIcon size={60} className="opacity-20" />
                                    <div className="absolute inset-0 bg-green-500/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={32} className="text-white" /></div>
                                    <span className="absolute bottom-2 left-2 text-[8px] bg-black/50 text-white px-2 py-0.5 rounded">preview.mp4</span>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <InteractiveLumi size="xs" variant="micro" emotion="happy" />
                                        <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Lumi 的初阅反馈</span>
                                    </div>
                                    <p className="text-xl font-bold text-white leading-relaxed">“{feedbackMsg}”</p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => setCurrentStep('reflection')}
                                    className="px-16 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                                >
                                    查看进化报告 <ArrowRight size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const UploadCard: React.FC<{ icon: any, title: string, color: string, bg: string, onClick: () => void }> = ({ icon: Icon, title, color, bg, onClick }) => (
    <motion.button 
        whileHover={{ scale: 1.05, y: -5 }}
        className="bg-white/5 ring-1 ring-inset ring-white/10 border border-white/10 rounded-[32px] p-8 flex flex-col items-center text-center gap-6 group hover:bg-white/10 transition-all shadow-xl"
        onClick={onClick}
    >
        <div className={`w-20 h-20 rounded-[28px] ${bg} flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={40} />
        </div>
        <div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-xs font-medium">支持拖拽或选择本地文件</p>
        </div>
        <div className="mt-4 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 group-hover:bg-cyan-500 group-hover:text-white transition-all">
            <Plus size={20} />
        </div>
    </motion.button>
);

const ReflectionDrawer: React.FC = () => {
    const { activeProject, onClosePBL, setCurrentStep, canvasScrollRef, selectedRole } = usePBL();
    
    const traceBack = (sectionId: string, stepId: PBLStep) => {
        setCurrentStep(stepId);
        setTimeout(() => {
            const el = document.getElementById(`pbl-section-${sectionId}`);
            if (el && canvasScrollRef.current) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const currentRole = activeProject?.rolePool.find(r => r.id === selectedRole);
    // Use dynamic discoveries from project pool, fallback to default if empty
    const discoveries = activeProject?.discoveryPool && activeProject.discoveryPool.length > 0 
        ? activeProject.discoveryPool 
        : [
            { id: 'fallback-d1', text: '探究正在深度进行中，更多发现将在复盘时解锁。', category: '项目实战' }
          ];

    return (
        <motion.aside 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 bg-[#05070a] shadow-2xl z-[110] flex flex-col overflow-hidden"
        >
            {/* Immersive Backdrop Ambience */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] animate-pulse"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40"></div>
            </div>

            {/* 1. TOP HEADER NAVIGATION (Journey Trace) */}
            <header className="relative z-20 h-24 px-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentStep('showcase')}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="h-10 w-px bg-white/5 hidden md:block"></div>
                    <div className="flex items-center gap-4">
                        <TracePoint icon={Rocket} color="text-cyan-400" onClick={() => traceBack('launch', 'launch')} />
                        <div className="w-4 h-px bg-white/10"></div>
                        <TracePoint icon={BookOpen} color="text-blue-400" onClick={() => traceBack('knowledge', 'knowledge')} />
                        <div className="w-4 h-px bg-white/10"></div>
                        <TracePoint icon={ShieldCheck} color="text-amber-400" onClick={() => traceBack('practice', 'practice')} />
                        <div className="w-4 h-px bg-white/10"></div>
                        <TracePoint icon={Presentation} color="text-fuchsia-400" onClick={() => traceBack('showcase', 'showcase')} />
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-cyan-400/60 tracking-[0.4em] uppercase">Phase Final</span>
                    <h2 className="text-white font-black text-lg">全息成长报告</h2>
                </div>
            </header>

            {/* 2. MAIN REPORT CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-8 md:px-16 py-8 pb-32">
                
                {/* Visual Anchor: 4.2 PROFESSIONAL GOLD CERTIFICATE */}
                <div className="flex flex-col items-center mb-16 relative">
                    <motion.div 
                        initial={{ scale: 0.5, rotateY: -90, opacity: 0 }} 
                        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.4 }}
                        className="relative perspective-1000"
                    >
                        {/* Glows */}
                        <div className="absolute inset-0 bg-amber-400 blur-[120px] opacity-20 animate-pulse"></div>
                        
                        {/* The Gold Certificate Card */}
                        <div className="relative w-[340px] h-[480px] bg-[#1a1d26] rounded-[24px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-[10px] border-[#222731] overflow-hidden flex flex-col items-center p-8 text-center ring-1 ring-white/10">
                            {/* Metallic Shimmer Effect Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shimmer pointer-events-none"></div>
                            
                            {/* Decorative Corners */}
                            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-500/50 rounded-tl-xl opacity-60"></div>
                            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-500/50 rounded-tr-xl opacity-60"></div>
                            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-500/50 rounded-bl-xl opacity-60"></div>
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-500/50 rounded-br-xl opacity-60"></div>

                            {/* Seal/Badge */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-1 mb-8 shadow-[0_10px_30px_rgba(245,158,11,0.3)]">
                                <div className="w-full h-full rounded-full border-2 border-white/40 border-dashed flex items-center justify-center text-white">
                                    <Trophy size={48} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <h4 className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.4em]">Professional Certification</h4>
                                <div className="h-px w-12 bg-amber-500/30 mx-auto"></div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center gap-4">
                                <span className="text-[12px] font-bold text-slate-400 italic">兹授予探险家</span>
                                <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-md">李华</h3>
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <span className="text-[12px] font-bold text-slate-400 italic">在「{activeProject?.title}」中荣获</span>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-lg leading-tight uppercase px-4">
                                    {currentRole?.title || '全能探险员'}
                                </h2>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 w-full flex justify-between items-end">
                                <div className="text-left">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Issue Authority</p>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <InteractiveLumi size="xs" variant="micro" emotion="happy" />
                                        <span className="text-[10px] font-bold font-mono">LUMI_CORE</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">XP Earned</p>
                                    <div className="text-xl font-black text-amber-500">+500</div>
                                </div>
                            </div>
                        </div>

                        {/* Floats */}
                        <div className="absolute -bottom-8 -right-8 bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-xl flex flex-col items-center">
                            <span className="text-[9px] text-cyan-400 font-black uppercase tracking-tighter">Level Advanced</span>
                            <div className="text-2xl font-black text-white">+500 <span className="text-xs opacity-50">XP</span></div>
                        </div>
                    </motion.div>
                    
                    <div className="mt-14 text-center">
                        <h3 className="text-4xl font-black text-white mb-2 tracking-tight">成长印记 · {activeProject?.title}</h3>
                        <p className="text-slate-400 font-mono text-xs tracking-[0.3em] uppercase opacity-60">Cognitive Log ID: {activeProject?.id?.toUpperCase()} // 2024.10.24</p>
                    </div>
                </div>

                {/* Bento Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
                    
                    {/* 1. Key Discoveries */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">探究我的新发现 (Insights)</h4>
                        </div>
                        <div className="grid gap-4">
                            {discoveries.map((disc, i) => (
                                <motion.div 
                                    key={disc.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 * i + 0.6 }}
                                    className="p-6 bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/5 ring-1 ring-inset ring-white/10 flex gap-5 group hover:bg-white/10 transition-all hover:scale-[1.01]"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-400/20 shadow-inner group-hover:scale-110 transition-transform">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black text-cyan-400/60 uppercase mb-1.5 tracking-widest">{disc.category}</div>
                                        <p className="text-base text-slate-200 leading-relaxed font-medium">"{disc.text}"</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Ability Matrix */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_#e879f9]"></div>
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">我的素养矩阵 (Ability Matrix)</h4>
                        </div>
                        <div className="flex-1 bg-white/5 backdrop-blur-xl ring-1 ring-inset ring-white/10 border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center shadow-2xl relative group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Fingerprint size={120} className="text-cyan-400" /></div>
                            <InteractiveRubric scores={[85, 82, 90, 60, 75]} />
                            
                            <div className="mt-8 w-full grid grid-cols-2 gap-4">
                                {[
                                    { label: '思维深度', val: '+22', color: 'text-cyan-400' },
                                    { label: '协作效能', val: '+15', color: 'text-fuchsia-400' }
                                ].map(item => (
                                    <div key={item.label} className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center">
                                        <div className="text-[9px] text-slate-600 font-black mb-1 uppercase tracking-widest">{item.label}</div>
                                        <div className={`text-2xl font-black ${item.color} drop-shadow-[0_0_8px_currentColor]`}>{item.val} <span className="text-[10px] opacity-40 font-normal">pts</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESONANCE WAVEFORM FOOTER */}
                <div className="mt-24 pt-12 border-t border-white/5 max-w-6xl mx-auto">
                    <div className="flex justify-between items-end mb-6 px-2">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">Thinking Resonance Waveform</h4>
                            <p className="text-sm text-slate-400 font-medium">项目探究全周期思维活跃度实时拟合曲线</p>
                        </div>
                        <div className="flex gap-2 text-cyan-400 font-mono text-[10px] bg-cyan-400/10 px-4 py-1.5 rounded-full border border-cyan-400/20 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div> ALIVE FEED
                        </div>
                    </div>
                    <div className="h-24 flex items-center justify-between gap-1.5 px-4">
                        {[...Array(60)].map((_, i) => (
                            <motion.div 
                                key={i} 
                                animate={{ 
                                    height: [12, Math.random() * 60 + 10, 12],
                                    opacity: [0.3, 0.7, 0.3],
                                    backgroundColor: i % 12 === 0 ? '#06b2d2' : '#1e293b'
                                }}
                                transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: i * 0.04 }}
                                className="flex-1 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            />
                        ))}
                    </div>
                </div>

                {/* FINAL ACTION */}
                <div className="mt-20 flex flex-col items-center gap-8">
                    <button 
                        onClick={onClosePBL}
                        className="group relative px-24 py-7 bg-white text-slate-900 rounded-[36px] font-black text-2xl shadow-[0_20px_60px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all overflow-hidden border-2 border-white/50"
                    >
                        <span className="relative z-10 flex items-center gap-3">收录印记 · 结束探究 <Check size={28} strokeWidth={3} /></span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-[-30deg] group-hover:translate-x-[250%] transition-transform duration-[1200ms]"></div>
                    </button>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] text-slate-700 font-bold tracking-[0.6em] uppercase">All Cognitive Data Securely Logged to LumiCloud v3.1</p>
                        <p className="text-[8px] text-slate-800 font-medium">Encryption: RSA-4096 // Protocol: SYNC_COMPLETE</p>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};

const ToolboxDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <motion.aside 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-72 md:w-80 border-l border-white/5 bg-[#0f1115] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] z-30 flex flex-col"
    >
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
            <h3 className="text-white font-black text-sm tracking-widest uppercase flex items-center gap-2">
                <ClipboardList size={16} className="text-cyan-400" /> 探究工具箱
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar">
            <ToolboxSection icon={BarChart} title="星际航线规划表" color="text-blue-400">
                <PlanningTimeline />
            </ToolboxSection>
            <ToolboxSection icon={PenTool} title="能力共振量规" color="text-purple-400">
                <InteractiveRubric />
            </ToolboxSection>
        </div>
    </motion.aside>
);

const ToolboxSection: React.FC<{ icon: any, title: string, color: string, children?: React.ReactNode }> = ({ icon: Icon, title, color, children }) => (
    <div className="space-y-4">
        <h4 className={`text-[10px] font-black uppercase tracking-widest ${color} flex items-center gap-2`}>
            <Icon size={12} /> {title}
        </h4>
        <div className="bg-white/5 ring-1 ring-inset ring-white/10 rounded-3xl p-4 border border-white/5 shadow-inner">
            {children || <div className="h-24 flex items-center justify-center text-[10px] text-slate-600 italic">待激活...</div>}
        </div>
    </div>
);

const PlanningTimeline: React.FC = () => {
    const { currentStep } = usePBL();
    const steps = ['启动', '建构', '探究', '展示', '复盘'];
    const activeIdx = ['launch', 'knowledge', 'practice', 'showcase', 'reflection'].indexOf(currentStep);

    return (
        <div className="flex flex-col gap-6 py-2">
            {steps.map((label, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                    {i < steps.length - 1 && (
                        <div className={`absolute left-[15px] top-8 w-0.5 h-6 ${i < activeIdx ? 'bg-cyan-500' : 'bg-white/10'}`} />
                    )}
                    <div className="relative">
                        <svg width="32" height="32" className="overflow-visible">
                            <defs>
                                <filter id={`glow-${i}`}>
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            <circle cx="16" cy="16" r={i === activeIdx ? "8" : "5"} fill={i <= activeIdx ? "#06b2d2" : "#334155"} filter={i === activeIdx ? `url(#glow-${i})` : ''} />
                            {i === activeIdx && (
                                <circle cx="16" cy="16" r={12} fill="none" stroke="#06b2d2" strokeWidth="1" strokeDasharray="2 2" className="animate-spin-slow" />
                            )}
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xs font-bold ${i === activeIdx ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                        {i === activeIdx && <span className="text-[9px] text-cyan-400 font-black animate-pulse">进行中...</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};
