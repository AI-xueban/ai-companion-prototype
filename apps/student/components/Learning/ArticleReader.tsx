import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, Sparkles, Clock, Quote, X, Play } from 'lucide-react';
import { Task } from '../../types';
import { Article, Vocabulary, MOCK_ARTICLES, BilingualCardData, isPlayableVideoArticle, isPortraitVideoArticle, formatDailyWordDateLabel, isBilingualToday } from '../../data/mockDiscoveryData';
import { checkInDailyWord, useDailyWordCheckIn } from '../../data/dailyWordCheckIn';
import { DailyWordCheckInBackgroundMark } from '../Dashboard/DailyWordCheckInMark';
import { DiscoveryCoverImage, DiscoveryBlockImage } from '../Dashboard/DiscoveryCoverImage';

interface ArticleReaderProps {
  task?: Task | null;
  articleId?: string;
  onExit: () => void;
  onComplete: () => void;
  hideArticleNav?: boolean;
  onResumeVideoFeed?: () => void;
}

// Helper component for highlighting vocabulary
const HighlightedText: React.FC<{ 
  text: string; 
  vocabulary: Vocabulary[]; 
  onWordClick: (vocab: Vocabulary, rect: DOMRect) => void; 
}> = ({ text, vocabulary, onWordClick }) => {
  if (!vocabulary || vocabulary.length === 0) return <>{text}</>;
  
  const sortedVocab = [...vocabulary].sort((a, b) => b.word.length - a.word.length);
  const pattern = new RegExp(`(${sortedVocab.map(v => v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(pattern);
  
  return (
    <>
      {parts.map((part, i) => {
        const vocab = sortedVocab.find(v => v.word === part);
        if (vocab) {
          return (
            <span 
              key={i} 
              className="border-b-2 border-indigo-400 border-dashed cursor-pointer text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors pb-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(vocab, e.currentTarget.getBoundingClientRect());
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

type ReactionType = 'like' | 'laugh' | 'mindblown';
type ReactionCounts = Record<ReactionType, number>;

const REACTION_FX: Record<
  ReactionType,
  { particles: string[]; burst: string; label: string; box: string }
> = {
  like: {
    particles: ['✨', '💡', '⭐', '📚', '✨'],
    burst: 'from-sky-200/80 to-blue-300/80',
    label: '涨知识啦！',
    box: 'bg-sky-50/90 border-sky-200',
  },
  laugh: {
    particles: ['⭐', '✨', '⭐', '收藏', '⭐'],
    burst: 'from-amber-200/80 to-yellow-300/80',
    label: '已收藏～',
    box: 'bg-amber-50/90 border-amber-200',
  },
  mindblown: {
    particles: ['❤️', '👍', '⭐', '点赞', '❤️'],
    burst: 'from-pink-200/80 to-rose-300/80',
    label: '点赞啦！',
    box: 'bg-rose-50/90 border-rose-200',
  },
};

const ARTICLE_NAV_BTN =
  'shrink-0 h-[76px] min-w-[72px] px-3 flex items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-[0.97] transition-all';

const ReaderToast = ({ message, visible }: { message: string; visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
      >
        <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-black border-[3px] border-white shadow-[0_6px_0_rgba(0,0,0,0.12)] flex items-center gap-2">
          <span className="text-lg">🐣</span>
          {message}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ReactionButton = ({
  reaction,
  count,
  fxKey,
  onReact,
}: {
  reaction: { id: ReactionType; icon: string; label: string };
  count: number;
  fxKey: number;
  onReact: () => void;
}) => {
  const theme = REACTION_FX[reaction.id];
  return (
    <button
      type="button"
      onClick={onReact}
      className={`relative flex flex-col items-center justify-center w-[76px] h-[76px] rounded-2xl border ${theme.box} shadow-sm active:scale-95 transition-transform overflow-visible`}
    >
      <AnimatePresence mode="wait">
        {fxKey > 0 && (
          <motion.div
            key={fxKey}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`absolute w-14 h-14 rounded-full bg-gradient-to-br ${theme.burst}`}
            />
            <motion.span
              initial={{ scale: 0.5, y: 8, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], y: -28, opacity: [0, 1, 0] }}
              transition={{ duration: 0.65 }}
              className="absolute text-[11px] font-black text-violet-700 bg-white/95 px-2 py-0.5 rounded-full border-2 border-violet-200 whitespace-nowrap z-30"
            >
              {theme.label}
            </motion.span>
            {theme.particles.map((p, i) => {
              const angle = (i / theme.particles.length) * Math.PI * 2;
              const dx = Math.cos(angle) * 36;
              const dy = Math.sin(angle) * 36;
              return (
                <motion.span
                  key={`${fxKey}-${i}`}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{ x: dx, y: dy, scale: [0, 1.3, 0.8], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.55, delay: i * 0.03 }}
                  className="absolute text-base z-10"
                >
                  {p}
                </motion.span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.span
        animate={fxKey > 0 ? { scale: [1, 1.35, 1], rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="text-[26px] leading-none relative z-10"
      >
        {reaction.icon}
      </motion.span>
      <span className="text-xs font-semibold text-gray-600 mt-1.5 relative z-10">
        {reaction.label} {count}
      </span>
    </button>
  );
};

const DailyWordBody = ({ card, checkedIn }: { card: BilingualCardData; checkedIn: boolean }) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 p-6 shadow-sm">
    <DailyWordCheckInBackgroundMark checkedIn={checkedIn} variant="detail" />
    <div className="relative z-[1] space-y-4">
      <div>
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">单词</p>
        <p className="text-3xl font-black text-blue-700">{card.english}</p>
      </div>
      {card.pronunciation && (
        <div>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">音标</p>
          <p className="text-base text-slate-600 italic">{card.pronunciation}</p>
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">释义</p>
        <p className="text-lg text-gray-800 font-medium leading-relaxed">{card.chinese}</p>
      </div>
      {card.exampleSentence && (
        <div className="pt-2 border-t border-blue-100">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">例句</p>
          <p className="text-[17px] leading-loose text-gray-700 italic">{card.exampleSentence}</p>
          {card.exampleTranslation && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{card.exampleTranslation}</p>
          )}
        </div>
      )}
    </div>
  </div>
);

const ArticleVideoEmbed = ({
  article,
  caption,
}: {
  article: Article;
  caption?: string;
}) => {
  const video = article.videoCard;
  if (!video?.isVideo) return null;
  const isPortrait = video.portraitCover;

  return (
    <div className="my-4 flex justify-center w-full">
      <div
        className={`flex flex-col items-center w-full ${
          isPortrait ? 'max-w-[280px]' : 'max-w-xl'
        }`}
      >
        <div
          className={`relative w-full rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/10 bg-gray-900 group cursor-pointer ${
            isPortrait ? 'aspect-[9/16]' : 'aspect-video'
          }`}
        >
          <DiscoveryCoverImage
            article={article}
            portrait={isPortrait}
            className={`w-full h-full object-cover object-center${isPortrait ? ' scale-[1.08]' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`flex items-center justify-center group-hover:scale-110 transition-transform ${
                isPortrait
                  ? 'w-14 h-14 rounded-full bg-white/20 border-2 border-white/60 backdrop-blur-sm'
                  : 'w-14 h-14 rounded-full bg-white/90 shadow-xl'
              }`}
            >
              <Play
                size={24}
                className={`ml-1 ${isPortrait ? 'text-white' : 'text-emerald-600'}`}
                fill="currentColor"
              />
            </div>
            <div className="mt-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {video.duration}
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {video.views}播放
          </div>
        </div>
        {caption && (
          <p className="w-full text-[11px] text-gray-400 font-medium text-center mt-2 leading-relaxed">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};

export const ArticleReader: React.FC<ArticleReaderProps> = ({ task, articleId, onExit, onComplete, hideArticleNav = false, onResumeVideoFeed }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });

  // State for current article (allows navigation within reader)
  const [currentArticleId, setCurrentArticleId] = useState<string>(articleId || (MOCK_ARTICLES[0]?.id));

  const readableArticles = React.useMemo(
    () => MOCK_ARTICLES.filter(a => !a.shortVideo?.isShort),
    []
  );

  const currentArticleIndex = React.useMemo(
    () => readableArticles.findIndex(a => a.id === currentArticleId),
    [readableArticles, currentArticleId]
  );

  // Derive current article data
  const article = React.useMemo(() =>
    MOCK_ARTICLES.find(a => a.id === currentArticleId) || MOCK_ARTICLES[0],
  [currentArticleId]);

  const publishDateLabel =
    article.bilingualCard?.type === '每日一词'
      ? formatDailyWordDateLabel(article.publishDate)
      : article.publishDate;

  const isTodayDailyWord =
    article.bilingualCard?.type === '每日一词' && isBilingualToday(article.publishDate);
  const isDailyWordArticle = article.bilingualCard?.type === '每日一词';
  const dailyWordCheckedIn = useDailyWordCheckIn(isDailyWordArticle ? article.id : undefined);

  useEffect(() => {
    if (articleId) setCurrentArticleId(articleId);
  }, [articleId]);

  // Parallax Header Logic
  const imageY = useTransform(scrollY, [0, 300], [0, 150]);
  const headerOpacity = useTransform(scrollY, [200, 300], [0, 1]);
  
  const defaultReactions: ReactionCounts = { like: 0, laugh: 0, mindblown: 0 };
  const [reactionsByArticle, setReactionsByArticle] = useState<Record<string, ReactionCounts>>({});
  const [reactionFxKeys, setReactionFxKeys] = useState<Record<ReactionType, number>>({
    like: 0,
    laugh: 0,
    mindblown: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const currentReactions = reactionsByArticle[currentArticleId] ?? defaultReactions;
  
  // Vocabulary Definition Popover State
  const [activeVocab, setActiveVocab] = useState<{ data: Vocabulary; rect: DOMRect } | null>(null);

  // Text Selection / Quote Collection State
  const [showQuoteBtn, setShowQuoteBtn] = useState(false);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState('');

  // Reset state when article changes
  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
    setActiveVocab(null);
    setShowQuoteBtn(false);
  }, [currentArticleId]);

  // Handle Text Selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 5) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Check if selection is inside our container
        if (containerRef.current?.contains(selection.anchorNode)) {
          setSelectionRect(rect);
          setSelectedText(selection.toString());
          setShowQuoteBtn(true);
          return;
        }
      }
      setShowQuoteBtn(false);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2200);
  };

  const handleTodayDailyWordCheckIn = () => {
    checkInDailyWord(article.id);
    showToast('已打卡今日单词⭐');
  };

  const goToPrevArticle = () => {
    if (currentArticleIndex <= 0) {
      showToast('已经是第一篇啦~');
      return;
    }
    setCurrentArticleId(readableArticles[currentArticleIndex - 1].id);
  };

  const goToNextArticle = () => {
    if (currentArticleIndex < 0 || currentArticleIndex >= readableArticles.length - 1) {
      showToast('已经是最后一篇啦~');
      return;
    }
    setCurrentArticleId(readableArticles[currentArticleIndex + 1].id);
  };

  const handleReaction = (type: ReactionType) => {
    setReactionsByArticle(prev => {
      const prevCounts = prev[currentArticleId] ?? defaultReactions;
      return {
        ...prev,
        [currentArticleId]: {
          ...prevCounts,
          [type]: prevCounts[type] + 1,
        },
      };
    });
    setReactionFxKeys(prev => ({ ...prev, [type]: prev[type] + 1 }));
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleVocabClick = (vocab: Vocabulary, rect: DOMRect) => {
    setActiveVocab({ data: vocab, rect });
  };

  const handleCollectQuote = () => {
    // Mock collection
    setShowQuoteBtn(false);
    // Show a toast or feedback
    alert(`已收藏金句：\n"${selectedText}"`);
    window.getSelection()?.removeAllRanges();
  };

  const showVideoFeedHero = !!onResumeVideoFeed && isPlayableVideoArticle(article);
  const videoPortrait = isPortraitVideoArticle(article);

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden flex flex-col font-sans" onClick={() => setActiveVocab(null)}>
      
      {/* 1. Navbar */}
      <motion.div 
        className="absolute top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between"
        style={{ backgroundColor: `rgba(255, 255, 255, ${headerOpacity})`, backdropFilter: `blur(${Number(headerOpacity) * 20}px)` }}
      >
        <motion.div 
            className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-gray-100 opacity-0" 
            style={{ opacity: headerOpacity }}
        />

        <button
          onClick={onExit}
          className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors z-10"
        >
          <ChevronLeft size={24} />
        </button>

        <motion.div
            className="text-sm font-bold text-gray-900 opacity-0 z-10 truncate max-w-[200px]"
            style={{ opacity: headerOpacity }}
        >
            {article.title}
        </motion.div>

        <div className="w-10 h-10" />
      </motion.div>

      {/* 2. Scrollable Content Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto no-scrollbar relative bg-[#f8f9fa]">
        
        {/* A. Hero — 从视频展开时上半屏为可返回刷视频的封面 */}
        {showVideoFeedHero ? (
          <div className="relative h-[50vh] min-h-[300px] w-full overflow-hidden shrink-0 bg-black">
            <DiscoveryCoverImage
              article={article}
              portrait={videoPortrait}
              className={`w-full h-full ${videoPortrait ? 'object-cover' : 'object-contain'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
            <button
              type="button"
              onClick={onResumeVideoFeed}
              className="absolute inset-0 flex items-center justify-center z-10"
              aria-label="返回视频播放"
            >
              <div className="w-16 h-16 rounded-full bg-white/25 border-2 border-white/60 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                <Play size={28} className="text-white ml-1" fill="currentColor" />
              </div>
            </button>
            <p className="absolute bottom-3 left-0 right-0 text-center text-white/70 text-[11px] font-medium z-10 pointer-events-none">
              点击播放 · 继续上下滑动刷视频
            </p>
          </div>
        ) : (
        <>
        <div className="relative h-[320px] w-full overflow-hidden shrink-0">
          <motion.div style={{ y: imageY }} className="w-full h-[120%] absolute top-0">
            <DiscoveryCoverImage
              article={article}
              portrait={!!article.shortVideo?.isShort}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fa] via-transparent to-black/30" />
          </motion.div>

          <div className="absolute bottom-8 left-6 z-10 pr-6">
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-3"
             >
                <span className="bg-orange-500/90 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/20 tracking-wide uppercase">
                  {article.author}
                </span>
                <span className="bg-black/40 backdrop-blur text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock size={10} />
                  {article.readTime}
                </span>
             </motion.div>
             
             <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-gray-900 leading-tight drop-shadow-sm"
             >
               <span className="bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-700">
                 {article.title}
               </span>
             </motion.h1>
          </div>
        </div>
        </>
        )}

        {/* B. Article Body */}
        <div className={`px-6 max-w-2xl mx-auto relative z-20 ${showVideoFeedHero ? 'pt-4' : '-mt-4'} ${isTodayDailyWord ? 'pb-28' : 'pb-32'}`}>
            
            {showVideoFeedHero && (
              <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">{article.title}</h1>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{article.author}</span>
                  <span>·</span>
                  <span>{publishDateLabel}</span>
                </div>
              </div>
            )}

            {/* Meta Info */}
            {!showVideoFeedHero && (
            <div className="flex items-center justify-between mb-8 text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200" />
                    <span>{article.author}</span>
                </div>
                <span>{publishDateLabel}</span>
            </div>
            )}

            {/* Content Blocks */}
            <div className="space-y-8 select-text">
                {article.bilingualCard?.type === '每日一词' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <DailyWordBody card={article.bilingualCard} checkedIn={dailyWordCheckedIn} />
                  </motion.div>
                ) : (
                article.blocks?.map((block, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                    >
                        {/* 1. Intro Text */}
                        {block.type === 'intro' && (
                            <p className="text-xl font-medium leading-loose text-gray-800 first-letter:text-4xl first-letter:font-black first-letter:mr-1 first-letter:float-left first-letter:leading-none">
                                <HighlightedText text={block.content} vocabulary={article.vocabulary} onWordClick={handleVocabClick} />
                            </p>
                        )}

                        {/* 2.5 Video Block */}
                        {block.type === 'video' && !showVideoFeedHero && article.videoCard?.isVideo && (
                            <ArticleVideoEmbed article={article} caption={block.caption} />
                        )}

                        {/* 2. Standard Text */}
                        {block.type === 'text' && (
                            <p className="text-[17px] leading-loose text-gray-600 font-normal tracking-wide text-justify">
                                <HighlightedText text={block.content} vocabulary={article.vocabulary} onWordClick={handleVocabClick} />
                            </p>
                        )}

                        {/* 3. Image Block */}
                        {block.type === 'image' && (
                            <div className="rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/5 my-4 group cursor-pointer">
                                <div className="overflow-hidden relative">
                                    <DiscoveryBlockImage
                                      article={article}
                                      src={block.src}
                                      alt={block.caption}
                                      className="w-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                    {/* 视频播放示意覆盖层（当文章是视频类内容时显示） */}
                                    {article.videoCard?.isVideo && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform mb-2">
                                                <Play size={24} className="text-emerald-600 ml-1" fill="currentColor" />
                                            </div>
                                            <div className="bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                                                {article.videoCard.duration}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {block.caption && (
                                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">{block.caption}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. Highlight Card（跳过关键知识点） */}
                        {block.type === 'card' && block.title !== '关键知识点' && (
                            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.15)] relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400" />
                                <h3 className="text-indigo-900 font-black text-lg mb-3 flex items-center gap-2">
                                    <span className="text-2xl">{block.icon}</span>
                                    {block.title}
                                </h3>
                                <p className="text-indigo-800/80 text-sm leading-relaxed font-medium">
                                    <HighlightedText text={block.content} vocabulary={article.vocabulary} onWordClick={handleVocabClick} />
                                </p>
                            </div>
                        )}

                         {/* 5. Quote */}
                         {block.type === 'quote' && (
                            <div className="relative pl-6 py-2">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 rounded-full" />
                                <p className="text-xl font-serif italic text-gray-800 mb-2">"{block.content}"</p>
                                {block.author && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">— {block.author}</p>}
                            </div>
                        )}
                    </motion.div>
                ))
                )}
            </div>
            
            {/* 上一篇 · 表情 · 下一篇（视频展开阅读时不显示） */}
            {!hideArticleNav && (
            <div className="mt-8 mb-2 flex items-center justify-center gap-2 max-w-full px-0.5">
              <button type="button" onClick={goToPrevArticle} className={ARTICLE_NAV_BTN}>
                &lt;上一篇
              </button>
              <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-2 py-2">
                {(
                  [
                    { id: 'like' as const, icon: '🤯', count: currentReactions.like, label: '涨知识' },
                    { id: 'laugh' as const, icon: '⭐', count: currentReactions.laugh, label: '收藏' },
                    { id: 'mindblown' as const, icon: '❤️', count: currentReactions.mindblown, label: '点赞' },
                  ] as const
                ).map(reaction => (
                  <ReactionButton
                    key={reaction.id}
                    reaction={reaction}
                    count={reaction.count}
                    fxKey={reactionFxKeys[reaction.id]}
                    onReact={() => handleReaction(reaction.id)}
                  />
                ))}
              </div>
              <button type="button" onClick={goToNextArticle} className={ARTICLE_NAV_BTN}>
                下一篇&gt;
              </button>
            </div>
            )}

            {/* Related Articles (Recommendation) */}
            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <div className="mt-16 pt-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Sparkles size={14} className="text-yellow-500" />
                  你可能感兴趣
                </h3>
                <div className="space-y-4">
                  {article.relatedArticles.map(relId => {
                    const relArticle = MOCK_ARTICLES.find(a => a.id === relId);
                    if (!relArticle) return null;
                    return (
                      <div 
                        key={relId}
                        onClick={() => setCurrentArticleId(relId)}
                        className="flex gap-4 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-50"
                      >
                         <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                           <DiscoveryCoverImage article={relArticle} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 py-1">
                           <h4 className="font-bold text-gray-800 text-sm leading-tight mb-2 line-clamp-2">{relArticle.title}</h4>
                           <span className="text-xs text-gray-400">{relArticle.readTime} · {relArticle.author}</span>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

        </div>
      </div>
      
      {/* 4. Definition Popover */}
      <AnimatePresence>
        {activeVocab && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
              onClick={() => setActiveVocab(null)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 10 }}
               className="absolute z-50 bg-white rounded-2xl shadow-2xl p-4 w-64 border border-indigo-100"
               style={{ 
                 top: Math.min(activeVocab.rect.top + 40, window.innerHeight - 200), // Prevent overflow
                 left: Math.max(20, Math.min(activeVocab.rect.left - 80, window.innerWidth - 280)) 
               }}
            >
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h3 className="text-xl font-black text-indigo-900">{activeVocab.data.word}</h3>
                   <p className="text-sm text-indigo-400 font-mono">{activeVocab.data.pinyin}</p>
                 </div>
                 <button className="text-gray-300 hover:text-gray-500" onClick={() => setActiveVocab(null)}><X size={16}/></button>
               </div>
               <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-2 mt-2">
                 {activeVocab.data.definition}
               </p>
               <button className="w-full mt-3 bg-indigo-50 text-indigo-600 text-xs font-bold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                 + 加入生词本
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. Quote Collection Button */}
      <AnimatePresence>
        {showQuoteBtn && selectionRect && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleCollectQuote}
            className="fixed z-[60] bg-gray-900 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold"
            style={{
              top: selectionRect.top - 50,
              left: selectionRect.left + (selectionRect.width / 2) - 60
            }}
          >
            <Quote size={14} className="text-yellow-400" />
            收藏金句
          </motion.button>
        )}
      </AnimatePresence>

      <ReaderToast message={toastMessage ?? ''} visible={!!toastMessage} />

      {isTodayDailyWord && (
        <div className="fixed bottom-0 left-0 right-0 z-[65] border-t border-blue-100 bg-white/95 backdrop-blur-md shadow-[0_-6px_24px_rgba(59,130,246,0.08)]">
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleTodayDailyWordCheckIn}
              className={`
                w-full py-3.5 rounded-2xl font-black text-base shadow-md
                active:scale-[0.98] transition-all
                ${dailyWordCheckedIn
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25'}
              `}
            >
              {dailyWordCheckedIn ? '今日已打卡 ✓' : '打卡今日单词'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
