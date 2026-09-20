
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image, PenTool, ChevronLeft, Sparkles, Check, Languages, AlignLeft, ScanLine, ArrowRight, RefreshCw, Wand2, ChevronDown, CheckCircle2, AlertCircle, Eye, EyeOff, History, Lightbulb, Trophy, FileText, Calendar, PenLine } from 'lucide-react';
import { EssayData, SubjectType, EssayAnalysisResult, EssayAnnotation } from '../../types';
import { mockEssayOCR, analyzeEssay, getHistorySnapshot } from '../../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface EssayLabContainerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: SubjectType;
  demoTrigger?: 'english' | 'chinese' | null;
}

type Step = 'capture' | 'edit' | 'analyzing' | 'report';

// Helper to split text into interactive segments
interface TextSegment {
    id: string;
    text: string;
    annotation?: EssayAnnotation;
    isReplaced?: boolean;
}

// Mock History Data
const MOCK_HISTORY = [
    { id: 'h1', date: '今天 10:30', subject: '英语', title: 'Technology in Our Life', score: 78, type: 'english' },
    { id: 'h2', date: '昨天 16:45', subject: '语文', title: '那一次，我长大了', score: 88, type: 'chinese' },
    { id: 'h3', date: '10月24日', subject: '英语', title: 'My Best Friend', score: 92, type: 'english' }, 
];

export const EssayLabContainer: React.FC<EssayLabContainerProps> = ({ isOpen, onClose, defaultSubject = '英语', demoTrigger }) => {
  const [step, setStep] = useState<Step>('capture');
  const [currentSubject, setCurrentSubject] = useState<SubjectType>(defaultSubject);
  const [essayData, setEssayData] = useState<EssayData | null>(null);
  const [editableContent, setEditableContent] = useState('');
  
  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<EssayAnalysisResult | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [modifiedTextSegments, setModifiedTextSegments] = useState<TextSegment[]>([]);
  
  // Interactive Challenge State
  const [challengeStatus, setChallengeStatus] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Interaction Modes
  const [isPolishedView, setIsPolishedView] = useState(false); // Toggle "One-click Polish" view
  const [isComparing, setIsComparing] = useState(false); // "Hold to Compare" state
  const [isHistoryMode, setIsHistoryMode] = useState(false); // NEW: Track if viewing history
  
  // UI State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Popover State
  const [popoverPosition, setPopoverPosition] = useState<{top: number, left: number} | null>(null);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('capture');
      setEssayData(null);
      setEditableContent('');
      setAnalysisResult(null);
      setModifiedTextSegments([]);
      setIsPolishedView(false);
      setActiveAnnotationId(null);
      setCurrentSubject(defaultSubject); 
      setIsHistoryOpen(false);
      setIsHistoryMode(false);
    }
  }, [isOpen, defaultSubject]);

  useEffect(() => {
    setPortalTarget(
      document.getElementById('app-viewport') ||
      document.getElementById('modal-root') ||
      null
    );
  }, []);

  // Handle Demo Trigger
  useEffect(() => {
      if (isOpen && demoTrigger) {
          handleSelectDemo(demoTrigger);
      }
  }, [isOpen, demoTrigger]);

  // --- Handlers ---

  const handleSelectDemo = async (type: 'english' | 'chinese') => {
    const subject = type === 'english' ? '英语' : '语文';
    setCurrentSubject(subject);
    setIsHistoryMode(false);
    
    // Auto-advance
    setStep('analyzing');
    
    // Simulate OCR
    const data = await mockEssayOCR(type);
    setEssayData(data);
    setEditableContent(data.content);
    
    // After OCR, go to Edit first to show "recognition success"
    setTimeout(() => {
        setStep('edit');
    }, 800);
  };

  const handleLoadHistory = async (item: typeof MOCK_HISTORY[0]) => {
      setIsHistoryOpen(false);
      
      // 1. Set Context
      setCurrentSubject(item.subject as SubjectType);
      setIsHistoryMode(true);

      // 2. Instant Load (Snapshot)
      // We don't use 'analyzing' step here. We jump straight to report.
      const snapshot = await getHistorySnapshot(item.id, item.type as 'english' | 'chinese');
      
      setEssayData(snapshot.essay);
      setEditableContent(snapshot.essay.content);
      setAnalysisResult(snapshot.result);
      
      // 3. Prepare View State (Revision State)
      // Default to Polished View for History to show "Best Version"
      setIsPolishedView(true); 
      
      // Process segments for the annotated view (in case user toggles back)
      const segments = processTextSegments(snapshot.essay.content, snapshot.result.annotations);
      setModifiedTextSegments(segments);

      // 4. Navigate
      setStep('report');
  };

  const handleStartAnalysis = async () => {
    if (!essayData) return;
    setStep('analyzing');
    
    // Call Mock AI Service
    const result = await analyzeEssay(essayData);
    setAnalysisResult(result);
    
    // Process text into segments for rendering (Annotated View)
    const segments = processTextSegments(editableContent, result.annotations);
    setModifiedTextSegments(segments);

    setTimeout(() => setStep('report'), 1500); // Analysis delay
  };

  const handleResumeEditing = () => {
      // Switch back to edit mode with current content
      setStep('edit');
      // We keep isHistoryMode = true to imply we are editing an existing record, 
      // or set false to treat as new version. Let's set false to "fork" it.
      setIsHistoryMode(false);
      setIsPolishedView(false);
  };

  const processTextSegments = (fullText: string, annotations: EssayAnnotation[]): TextSegment[] => {
      // Sort annotations by startIndex
      const sorted = [...annotations].sort((a, b) => a.startIndex - b.startIndex);
      const segments: TextSegment[] = [];
      let currentIndex = 0;

      sorted.forEach((ann, idx) => {
          // Push text before annotation
          if (ann.startIndex > currentIndex) {
              segments.push({
                  id: `text-${currentIndex}`,
                  text: fullText.substring(currentIndex, ann.startIndex)
              });
          }
          // Push annotation
          segments.push({
              id: ann.id,
              text: fullText.substring(ann.startIndex, ann.endIndex),
              annotation: ann
          });
          currentIndex = ann.endIndex;
      });

      // Push remaining text
      if (currentIndex < fullText.length) {
          segments.push({
              id: `text-${currentIndex}`,
              text: fullText.substring(currentIndex)
          });
      }

      return segments;
  };

  const handleAnnotationClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      
      // Close if clicking the same one
      if (activeAnnotationId === id) {
          setActiveAnnotationId(null);
          return;
      }

      const target = e.currentTarget as HTMLElement;
      
      // Relative Position Calculation
      // We calculate position relative to the scroll container `report-scroll-view`
      const container = document.getElementById('report-scroll-view');
      if (container) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          
          // Calculate Top: Element Bottom relative to viewport - Container Top relative to viewport + Container Scroll Top
          // Add offset for the arrow
          const top = targetRect.bottom - containerRect.top + container.scrollTop + 14; 
          
          // Calculate Left: Center of target relative to container left
          const left = targetRect.left - containerRect.left + (targetRect.width / 2);
          
          setPopoverPosition({ top, left });
      }
      
      // Prepare Challenge State
      const ann = analysisResult?.annotations.find(a => a.id === id);
      if (ann) {
          if (ann.type === 'suggestion') {
              // Prepare options for challenge
              const opts = [ann.suggestion || '', ...(ann.distractors || [])];
              // Shuffle options
              setShuffledOptions(opts.sort(() => Math.random() - 0.5));
              setChallengeStatus('unanswered');
              setSelectedOption(null);
          } else {
              // Correction mode doesn't need shuffle
              setChallengeStatus('unanswered'); // Not used but reset
          }
      }

      setActiveAnnotationId(id);
  };

  const handleApplySuggestion = (segmentId: string, newWord: string) => {
      setModifiedTextSegments(prev => prev.map(seg => {
          if (seg.id === segmentId) {
              return {
                  ...seg,
                  text: newWord,
                  isReplaced: true
              };
          }
          return seg;
      }));
      setActiveAnnotationId(null);
  };

  const handleChallengeSelection = (option: string, correctSuggestion: string) => {
      setSelectedOption(option);
      if (option === correctSuggestion) {
          setChallengeStatus('correct');
      } else {
          setChallengeStatus('wrong');
      }
  };

  const handleBack = () => {
      if (step === 'report') {
          if (isHistoryMode) {
              // If in history mode, back goes to sidebar (capture state)
              setStep('capture');
              setIsHistoryMode(false);
              setIsHistoryOpen(true);
          } else {
              setStep('edit');
          }
      } else if (step === 'edit') {
          setStep('capture');
      } else {
          setStep('capture');
      }
  };

  // --- Renderers ---

  if (!portalTarget) return null;

  const activeAnnotation = activeAnnotationId ? analysisResult?.annotations.find(a => a.id === activeAnnotationId) : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-gray-900/90 backdrop-blur-md"
            />

            {/* Main Modal */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl h-[95vh] lg:h-[90vh] bg-white md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        {step !== 'capture' && (
                            <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        
                        {isHistoryMode && step === 'report' ? (
                            // Contextual Header for History
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black text-gray-800 leading-tight">
                                        {essayData?.title || '未命名文档'}
                                    </h2>
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                                        已归档
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                    <Calendar size={10} /> 10月24日 · {currentSubject}
                                </p>
                            </div>
                        ) : (
                            // Standard Header
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${currentSubject === '英语' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    <PenTool size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-800 leading-tight">AI 智批作文室</h2>
                                    <p className="text-xs text-gray-400 font-bold">
                                        {step === 'capture' ? '拍照 / 录入' : step === 'edit' ? '确认文稿' : step === 'analyzing' ? 'AI 分析中' : '批改报告'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        {step === 'capture' && (
                            <button 
                                onClick={() => setIsHistoryOpen(true)}
                                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 px-3"
                            >
                                <History size={18} />
                                <span className="text-xs font-bold hidden md:inline">批改记录</span>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body Switcher */}
                <div className="flex-1 relative overflow-hidden bg-gray-50 flex flex-col">
                    <AnimatePresence mode="wait">
                        
                        {/* VIEW 1: CAPTURE STAGE */}
                        {step === 'capture' && (
                            <motion.div 
                                key="capture"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <div className="flex-1 m-4 md:m-8 bg-gray-800 rounded-[24px] relative overflow-hidden flex flex-col items-center justify-center group">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]"></div>
                                    <motion.div 
                                        animate={{ top: ['10%', '90%', '10%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-4 right-4 h-0.5 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] z-10"
                                    />
                                    <div className="text-white/50 flex flex-col items-center gap-4 relative z-20">
                                        <Camera size={64} strokeWidth={1} />
                                        <p className="font-medium tracking-widest text-sm uppercase">将作文放入框内</p>
                                    </div>
                                    <button className="absolute bottom-8 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <div className="w-14 h-14 bg-white rounded-full"></div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW 2: EDIT STAGE */}
                        {step === 'edit' && essayData && (
                            <motion.div 
                                key="edit"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                                    <div className="max-w-3xl mx-auto bg-white min-h-full rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 relative">
                                        <div className="absolute inset-0 pointer-events-none opacity-50" style={{backgroundImage: 'linear-gradient(#f3f4f6 1px, transparent 1px)', backgroundSize: '100% 2rem', marginTop: '2rem'}}></div>
                                        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-end">
                                            <div>
                                                <h1 className="text-2xl font-black text-gray-900 mb-1">{essayData.title}</h1>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${currentSubject === '英语' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {currentSubject}
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                <ScanLine size={14} /> OCR 识别完成
                                            </div>
                                        </div>
                                        <textarea 
                                            value={editableContent}
                                            onChange={(e) => setEditableContent(e.target.value)}
                                            className="w-full h-full min-h-[60vh] resize-none outline-none text-lg leading-loose text-gray-700 font-medium bg-transparent relative z-10"
                                            placeholder="内容为空..."
                                        />
                                    </div>
                                </div>
                                <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-20">
                                    <div className="bg-white p-2 rounded-full shadow-xl border border-gray-100 pointer-events-auto flex gap-2">
                                        <button onClick={() => setStep('capture')} className="px-6 py-3 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors">重拍</button>
                                        <button onClick={handleStartAnalysis} className="px-8 py-3 rounded-full font-bold text-white bg-brand hover:bg-brand-dark shadow-lg shadow-brand/20 transition-all active:scale-95 flex items-center gap-2">
                                            <Sparkles size={18} /> 开始批改
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW 3: ANALYZING STATE */}
                        {step === 'analyzing' && (
                            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white z-30">
                                <div className="relative">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-24 h-24 rounded-full border-4 border-gray-100 border-t-brand" />
                                    <div className="absolute inset-0 flex items-center justify-center"><Sparkles size={32} className="text-brand animate-pulse" /></div>
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-gray-800">Lumi 正在批改...</h3>
                                <p className="text-gray-400 text-sm mt-2 font-medium">分析逻辑结构 · 检查语法拼写 · 润色词汇</p>
                            </motion.div>
                        )}

                        {/* VIEW 4: REPORT DASHBOARD */}
                        {step === 'report' && analysisResult && (
                            <motion.div 
                                key="report"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col md:flex-row overflow-hidden"
                            >
                                {/* --- LEFT: DOCUMENT VIEW WRAPPER (Relative for button positioning) --- */}
                                <div className="flex-[1.5] h-full relative flex flex-col overflow-hidden bg-gray-50">
                                    
                                    {/* Actual Scroll Container */}
                                    <div 
                                        id="report-scroll-view" 
                                        className="flex-1 overflow-y-auto no-scrollbar relative w-full" 
                                        onClick={() => setActiveAnnotationId(null)}
                                    >
                                        <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
                                            <div className="bg-white min-h-[80vh] rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 relative transition-all">
                                                
                                                {/* Header */}
                                                <div className="mb-8 pb-6 border-b border-gray-100 flex justify-between items-end">
                                                    <div>
                                                        <h1 className="text-3xl font-black text-gray-900 mb-2">{essayData?.title}</h1>
                                                        <div className="flex gap-2">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${currentSubject === '英语' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{currentSubject}</span>
                                                            {isPolishedView && <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-1 rounded flex items-center gap-1"><Sparkles size={10} /> AI 润色版</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* TEXT CONTENT SWITCHER */}
                                                <div className="text-lg leading-loose font-medium whitespace-pre-wrap relative min-h-[400px]">
                                                    {/* MODE A: POLISHED VIEW */}
                                                    {isPolishedView ? (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-800">
                                                            {isComparing ? (
                                                                // While holding compare in polished view: Show Original
                                                                <div className="text-gray-400 select-none opacity-60 transition-opacity duration-200">{editableContent}</div>
                                                            ) : (
                                                                // Show Improved
                                                                <div>{analysisResult.improvedVersion}</div>
                                                            )}
                                                        </motion.div>
                                                    ) : (
                                                        // MODE B: ANNOTATED ORIGINAL VIEW
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-800">
                                                            {modifiedTextSegments.map((seg) => {
                                                                if (seg.annotation) {
                                                                    const type = seg.annotation.type;
                                                                    const isActive = activeAnnotationId === seg.id;
                                                                    const isReplaced = seg.isReplaced;

                                                                    // Golden Sentence (Good)
                                                                    if (type === 'good') {
                                                                        return (
                                                                            <span key={seg.id} className="bg-yellow-100 px-1 rounded relative group cursor-default border-b-2 border-yellow-200">
                                                                                {seg.text}
                                                                                <span className="absolute -top-3 right-0 text-[10px] bg-yellow-400 text-yellow-900 px-1.5 rounded-full font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                                                    ✨ 高光金句
                                                                                </span>
                                                                            </span>
                                                                        );
                                                                    }

                                                                    // Suggestions / Upgrades
                                                                    if (type === 'suggestion') {
                                                                        return (
                                                                            <span 
                                                                                key={seg.id}
                                                                                onClick={(e) => !isReplaced && handleAnnotationClick(e, seg.id)}
                                                                                className={`
                                                                                    relative rounded px-0.5 transition-all duration-200 cursor-pointer
                                                                                    ${isReplaced 
                                                                                        ? 'text-green-600 bg-green-50 font-bold decoration-green-300 decoration-2 underline underline-offset-4' 
                                                                                        : isActive 
                                                                                            ? 'bg-purple-100 text-purple-900 ring-2 ring-purple-200 rounded' 
                                                                                            : 'decoration-purple-400 decoration-wavy underline underline-offset-4 hover:bg-purple-50 text-gray-800'
                                                                                    }
                                                                                `}
                                                                            >
                                                                                {seg.text}
                                                                                {!isReplaced && <Sparkles size={12} className="inline ml-0.5 text-purple-400 -mt-2" />}
                                                                            </span>
                                                                        );
                                                                    }

                                                                    // Corrections
                                                                    if (type === 'correction') {
                                                                        return (
                                                                            <span 
                                                                                key={seg.id}
                                                                                onClick={(e) => !isReplaced && handleAnnotationClick(e, seg.id)}
                                                                                className={`
                                                                                    relative rounded px-0.5 transition-all duration-200 cursor-pointer
                                                                                    ${isReplaced 
                                                                                        ? 'text-gray-800' 
                                                                                        : isActive 
                                                                                            ? 'bg-red-100 ring-2 ring-red-200' 
                                                                                            : 'decoration-red-400 decoration-wavy underline underline-offset-4 hover:bg-red-50'
                                                                                    }
                                                                                `}
                                                                            >
                                                                                {seg.text}
                                                                            </span>
                                                                        );
                                                                    }
                                                                }
                                                                return <span key={seg.id}>{seg.text}</span>;
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* POPOVER (Absolute in container - needs to be here to position relative to scroll content) */}
                                        <AnimatePresence>
                                            {activeAnnotation && popoverPosition && !isPolishedView && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                    style={{ 
                                                        top: popoverPosition.top, 
                                                        left: popoverPosition.left,
                                                        transform: 'translateX(-50%)'
                                                    }}
                                                    className="absolute z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* Arrow */}
                                                    <div className="absolute -top-2 left-1/2 -ml-2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100"></div>

                                                    {/* ---- TRAFFIC LIGHT STRATEGY RENDER ---- */}
                                                    {activeAnnotation.type === 'correction' ? (
                                                        // === RED LIGHT: CORRECTION VIEW ===
                                                        <>
                                                            <div className="p-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                                                                <span className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-1">
                                                                    <AlertCircle size={12} strokeWidth={2.5} /> 错误纠正
                                                                </span>
                                                                <button onClick={() => setActiveAnnotationId(null)} className="p-1 hover:bg-red-100 rounded-full text-red-400"><X size={14}/></button>
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="flex items-center gap-2 mb-3 text-lg font-bold">
                                                                    <span className="text-gray-400 line-through decoration-red-300">{activeAnnotation.originalText}</span>
                                                                    <ArrowRight size={16} className="text-gray-300" />
                                                                    <span className="text-green-600 bg-green-50 px-1 rounded">{activeAnnotation.suggestion}</span>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 mb-4 border border-gray-100">
                                                                    <span className="font-bold text-gray-700 mr-1">💡 原因：</span>
                                                                    {activeAnnotation.explanation}
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleApplySuggestion(activeAnnotation.id, activeAnnotation.suggestion || '')}
                                                                    className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Check size={16} /> 立即修改
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        // === PURPLE LIGHT: CHALLENGE VIEW ===
                                                        <>
                                                            <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                                                                <span className="text-xs font-black text-purple-600 uppercase tracking-wider flex items-center gap-1">
                                                                    <Wand2 size={12} strokeWidth={2.5} /> 词汇升格挑战
                                                                </span>
                                                                <button onClick={() => setActiveAnnotationId(null)} className="p-1 hover:bg-purple-100 rounded-full text-purple-400"><X size={14}/></button>
                                                            </div>
                                                            
                                                            {challengeStatus === 'unanswered' ? (
                                                                // Phase 1: Question
                                                                <div className="p-4">
                                                                    <div className="text-gray-500 text-sm mb-1">原文：<span className="font-bold text-gray-800">{activeAnnotation.originalText}</span></div>
                                                                    <div className="text-purple-700 font-bold text-sm mb-4 leading-snug">
                                                                        📝 {activeAnnotation.contextQuery || '哪个表达更地道？'}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {shuffledOptions.map((opt, i) => (
                                                                            <button 
                                                                                key={i}
                                                                                onClick={() => handleChallengeSelection(opt, activeAnnotation.suggestion || '')}
                                                                                className="w-full text-left p-3 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all font-bold text-gray-600 hover:text-purple-700 text-sm"
                                                                            >
                                                                                {String.fromCharCode(65 + i)}. {opt}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Phase 2: Feedback & Explanation
                                                                <div className="p-4">
                                                                    <motion.div 
                                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                                        className={`flex items-center gap-2 mb-3 text-lg font-black ${challengeStatus === 'correct' ? 'text-green-600' : 'text-orange-500'}`}
                                                                    >
                                                                        {challengeStatus === 'correct' ? <Trophy size={20} /> : <Lightbulb size={20} />}
                                                                        {challengeStatus === 'correct' ? '表达更地道！' : '差点意思哦'}
                                                                    </motion.div>
                                                                    
                                                                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 mb-4 border border-gray-100 leading-relaxed">
                                                                        <div className="mb-2">
                                                                            <span className="text-xs font-bold text-gray-400 uppercase">Lumi 解析</span>
                                                                            <p className="mt-1">{activeAnnotation.explanation}</p>
                                                                        </div>
                                                                    </div>

                                                                    {challengeStatus === 'correct' ? (
                                                                        <button 
                                                                            onClick={() => handleApplySuggestion(activeAnnotation.id, activeAnnotation.suggestion || '')}
                                                                            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                                                                        >
                                                                            <Check size={16} /> 采用优化
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => setChallengeStatus('unanswered')}
                                                                            className="w-full py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                                                        >
                                                                            <RefreshCw size={16} /> 再试一次
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* FLOAT: Hold to Compare - FROSTED GLASS & ABSOLUTE POSITIONING */}
                                    <AnimatePresence>
                                        {isPolishedView && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="absolute bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-none"
                                            >
                                                <button 
                                                    onMouseDown={() => setIsComparing(true)}
                                                    onMouseUp={() => setIsComparing(false)}
                                                    onTouchStart={() => setIsComparing(true)}
                                                    onTouchEnd={() => setIsComparing(false)}
                                                    className="pointer-events-auto bg-gray-900/70 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 active:scale-95 transition-all select-none border border-white/15 hover:bg-gray-900/90 hover:border-white/30"
                                                >
                                                    {isComparing ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    {isHistoryMode ? '按住对比初始版本' : '按住看原文'}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* --- RIGHT: INTELLIGENCE PANEL --- */}
                                <div className="flex-1 md:max-w-sm bg-white border-l border-gray-100 flex flex-col h-full shadow-[-10px_0_40px_rgba(0,0,0,0.02)] z-10">
                                    <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
                                        
                                        {/* Score Card */}
                                        <div className="bg-gray-900 rounded-[24px] p-6 text-white mb-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand rounded-full blur-[60px] opacity-50"></div>
                                            <div className="relative z-10 flex justify-between items-end">
                                                <div>
                                                    <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">综合评分</div>
                                                    <div className="text-5xl font-black tracking-tighter">{analysisResult.score}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-brand-light font-bold text-sm">超越 85% 同龄人</div>
                                                    <div className="flex gap-1 mt-1 justify-end">
                                                        {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? 'bg-yellow-400' : 'bg-gray-700'}`}></div>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Radar Chart */}
                                        <div className="mb-8">
                                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <Sparkles size={14} className="text-brand" /> 维度分析
                                            </h3>
                                            <div className="w-full h-48 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysisResult.radarData}>
                                                        <PolarGrid stroke="#e5e7eb" />
                                                        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar
                                                            name="Score"
                                                            dataKey="score"
                                                            stroke="#8B5CF6"
                                                            strokeWidth={2}
                                                            fill="#8B5CF6"
                                                            fillOpacity={0.4}
                                                        />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div className="mb-8">
                                            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Lumi 总评</h3>
                                            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 leading-relaxed border border-gray-100 flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                                                    <Sparkles size={16} className="text-brand" />
                                                </div>
                                                {analysisResult.generalComment}
                                            </div>
                                        </div>

                                        {/* One-click Polish Action */}
                                        <div className="mt-auto">
                                            <div className="p-1 bg-gradient-to-r from-brand to-purple-500 rounded-[20px] shadow-lg shadow-brand/20">
                                                <button 
                                                    onClick={() => setIsPolishedView(!isPolishedView)}
                                                    className="w-full bg-white rounded-[18px] p-4 flex items-center justify-between group active:scale-[0.98] transition-transform"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPolishedView ? 'bg-brand text-white' : 'bg-purple-50 text-purple-600'}`}>
                                                            <Wand2 size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-bold text-gray-800 text-sm">一键润色</div>
                                                            <div className="text-xs text-gray-400">
                                                                {isPolishedView ? '已生成 AI 范文' : '查看 AI 优化版本'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isPolishedView ? 'bg-brand' : 'bg-gray-200'}`}>
                                                        <motion.div 
                                                            animate={{ x: isPolishedView ? 20 : 0 }}
                                                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                                                        />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                    
                                    {/* Close / Action Footer */}
                                    <div className="p-6 border-t border-gray-100">
                                        {isHistoryMode ? (
                                            <button 
                                                onClick={handleResumeEditing}
                                                className="w-full py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <PenLine size={18} />
                                                继续润色
                                            </button>
                                        ) : (
                                            <button onClick={onClose} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                                                完成批改
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* History Drawer Portal */}
                    <AnimatePresence>
                        {isHistoryOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    onClick={() => setIsHistoryOpen(false)}
                                    className="absolute inset-0 bg-black/20 z-40 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                    className="absolute top-0 bottom-0 right-0 w-80 bg-white z-50 shadow-2xl border-l border-gray-100 flex flex-col"
                                >
                                    {/* Drawer Header */}
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            <History size={18} />
                                            历史记录
                                        </h3>
                                        <button onClick={() => setIsHistoryOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                                    </div>
                                    {/* List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                                        {MOCK_HISTORY.map(item => (
                                            <button 
                                                key={item.id} 
                                                onClick={() => handleLoadHistory(item)}
                                                className="w-full text-left bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.subject === '英语' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.subject}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <Calendar size={10} />
                                                        {item.date}
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-sm mb-2 line-clamp-1 group-hover:text-brand transition-colors">{item.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand" style={{width: `${item.score}%`}}></div>
                                                    </div>
                                                    <span className="text-xs font-black text-brand">{item.score}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalTarget
  );
};
