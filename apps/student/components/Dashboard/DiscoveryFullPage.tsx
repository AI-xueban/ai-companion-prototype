import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Flame, Clock, BookOpen,
  Sparkles, Globe, GraduationCap, ChevronRight,
  Play, Radio, Languages, Telescope, Sprout, School,
  Brain, Clock3, Target, Feather,
  MapPin, Heart, Star, X, Coins, Users, PiggyBank, HandHeart, FileText
} from 'lucide-react';
import {
  CHARITY_DONATION_LEADERBOARD_ALL,
  CHARITY_DONATION_LEADERBOARD_LAST_MONTH,
  getPublishedMonthlyReport,
} from '../../data/mockCharityAdminData';
import {
  MOCK_ARTICLES,
  Article,
  ArticleCategory,
  getCategoryColor,
  getCategoryLabel,
  getArticleExcerpt,
  toLandscapeCoverUrl,
  BILINGUAL_CARD_TYPES,
  BilingualCardType,
  isBilingualToday,
  getTodayBilingualByType,
  isWithinDailyWordArchiveWindow,
  formatDailyWordDateLabel,
  getArticleRecencyScore,
  isPlayableVideoArticle,
  isPortraitVideoArticle,
  getArticleBodyPlainText,
  getVideoViewsLabel,
  getVideoLikesLabel,
  getVideoFavoritesLabel,
  getVideoAuthorLabel,
  getVideoDurationLabel,
  formatPublishDateLabel,
  pickNewsHotSpotItems,
} from '../../data/mockDiscoveryData';
import { useDailyWordCheckIns } from '../../data/dailyWordCheckIn';
import { DailyWordCheckInBackgroundMark } from './DailyWordCheckInMark';
import { DiscoveryCoverImage } from './DiscoveryCoverImage';

interface DiscoveryFullPageProps {
  onBack: () => void;
  onArticleClick: (articleId: string, options?: { hideNav?: boolean; onResumeVideoFeed?: () => void }) => void;
}

// ======================================================================
// 卡片组件
// ======================================================================

interface CardProps { key?: React.Key; article: Article; onClick: () => void; }

const formatArticleLikesLabel = (article: Article): string => {
  const fromVideo = getVideoLikesLabel(article);
  if (fromVideo) return fromVideo;
  const n = Math.round(article.readCount * 0.18);
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString();
};

// 双列网格卡（上图下文 · 校园 / 素养成长等一行两个）
const GridFeedCard = ({
  article,
  onClick,
  compactCover = false,
}: CardProps & { compactCover?: boolean }) => {
  const isVideo = isPlayableVideoArticle(article);
  const duration = isVideo ? getVideoDurationLabel(article) : article.readTime;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group min-w-0"
    >
      <div
        className={`relative bg-gray-100 overflow-hidden ${compactCover ? 'aspect-[8/3]' : 'aspect-[4/3]'}`}
      >
        <DiscoveryCoverImage
          article={article}
          portrait={isPortraitVideoArticle(article)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
        {duration && (
          <div className="absolute top-1.5 right-1.5 bg-black/55 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
            {duration}
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5 text-white/90 text-[8px] font-bold truncate max-w-[75%]">
          {article.author}
        </div>
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`rounded-full bg-white/25 border border-white/60 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform ${
                compactCover ? 'w-6 h-6' : 'w-8 h-8'
              }`}
            >
              <Play size={compactCover ? 10 : 12} className="text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
      <div className={`min-w-0 ${compactCover ? 'p-1.5' : 'p-2'}`}>
        <h3 className="font-bold text-gray-800 text-[11px] leading-snug line-clamp-2 mb-0.5">
          {article.title}
        </h3>
        <p
          className={`text-[10px] text-gray-500 line-clamp-2 leading-relaxed mb-1 ${
            compactCover ? 'min-h-[2em]' : 'min-h-[2.5em] mb-1.5'
          }`}
        >
          {getArticleExcerpt(article, 52)}
        </p>
        <div className="flex items-center justify-between gap-1 text-[9px] text-gray-400 font-medium min-w-0">
          <span className="shrink-0">{formatPublishDateLabel(article.publishDate)}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span>{article.readCount.toLocaleString()}阅读</span>
            <span className="flex items-center gap-0.5">
              <Heart size={8} className="text-rose-400" />
              {formatArticleLikesLabel(article)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MasonryWaterfall = ({
  articles,
  onArticleClick,
  compactCover = false,
}: {
  articles: Article[];
  onArticleClick: (id: string) => void;
  compactCover?: boolean;
}) => (
  <div className="grid grid-cols-2 gap-2">
    {articles.map(a => (
      <GridFeedCard
        key={a.id}
        article={a}
        compactCover={compactCover}
        onClick={() => onArticleClick(a.id)}
      />
    ))}
  </div>
);

// 2. 列表视图项 (时事 / 校园)
// 左文右图 · 资讯/美文通用卡片（首页时事、美文悦读）
const ContentFeedCard = ({
  article,
  onClick,
  embedded = false,
}: {
  article: Article;
  onClick: () => void;
  embedded?: boolean;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`w-full flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer active:bg-gray-50 transition-colors${embedded ? '' : ' mb-3'}`}
  >
    <div className="flex-1 flex flex-col justify-between min-w-0 min-h-[88px]">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="flex-1 min-w-0 font-bold text-gray-800 text-xs leading-snug line-clamp-1">
          {article.title}
        </h3>
        <span className="shrink-0 text-[10px] text-gray-400">
          {formatPublishDateLabel(article.publishDate)}
        </span>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-2">
        {getArticleExcerpt(article, 72)}
      </p>
      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400 font-medium min-w-0">
        <span className="truncate min-w-0">{article.author}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span>{article.readCount.toLocaleString()}阅读</span>
          <span className="flex items-center gap-0.5">
            <Heart size={9} className="text-rose-400" />
            {formatArticleLikesLabel(article)}
          </span>
        </div>
      </div>
    </div>
    <div className="w-[88px] h-[88px] shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
      <DiscoveryCoverImage article={article} className="w-full h-full object-cover" />
      <div className="absolute top-1 right-1 bg-black/55 text-white text-[8px] font-bold px-1 py-0.5 rounded backdrop-blur-sm">
        {article.readTime}
      </div>
    </div>
  </motion.div>
);

const ListItemCard = ({
  article,
  onClick,
  embedded = false,
}: {
  article: Article;
  onClick: () => void;
  embedded?: boolean;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`w-full flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer active:bg-gray-50 transition-colors${embedded ? '' : ' mb-3'}`}
  >
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          {article.category !== 'CURRENT_EVENTS' && article.category !== 'BILINGUAL' && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold
              ${article.category === 'CAMPUS_NEWS' ? 'text-sky-600 bg-sky-100' : 'text-red-600 bg-red-100'}`}>
              {getCategoryLabel(article.category)}
            </span>
          )}
          <span className="text-[10px] text-gray-400">{article.publishDate}</span>
        </div>
        <h3 className="font-bold text-gray-800 text-sm leading-relaxed line-clamp-2 mb-1">
          {article.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1 truncate">
          {article.blocks?.find(b => b.type === 'text' || b.type === 'intro')?.content || '点击查看详情...'}
        </p>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400 font-medium">
        <span className="flex items-center gap-1"><MapPin size={10} /> {article.author}</span>
        <span className="flex items-center gap-1"><Clock size={10} /> {article.readTime}</span>
      </div>
    </div>
    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
      <DiscoveryCoverImage article={article} className="w-full h-full object-cover" />
    </div>
  </motion.div>
);

// 3. 美文卡片
const LiteratureCard = ({
  article,
  onClick,
  embedded = false,
}: {
  article: Article;
  onClick: () => void;
  embedded?: boolean;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className={`relative p-5 bg-[#fffbf0] rounded-2xl border border-[#f3eacb] shadow-sm cursor-pointer group overflow-hidden${
      embedded ? '' : ' mb-3'
    }`}
  >
    <div className="absolute -right-4 -top-4 text-[#f8f1d6] group-hover:text-[#f0e6c0] transition-colors pointer-events-none">
      <Feather size={72} strokeWidth={1} />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] tracking-[0.2em] uppercase text-orange-900/40 font-serif">
          Essay & Poem
        </span>
        <span className="text-[10px] text-orange-900/35 font-medium shrink-0 ml-2">
          {formatPublishDateLabel(article.publishDate)}
        </span>
      </div>
      <h3 className="text-base font-serif font-bold text-gray-900 mb-2 leading-relaxed group-hover:text-orange-900 transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="text-sm text-gray-600 font-serif leading-loose line-clamp-3 mb-3 opacity-80">
        {getArticleExcerpt(article, 96)}
      </p>
      <div className="flex items-center justify-between gap-2 text-[10px] text-orange-900/45 font-medium">
        <span className="font-bold text-gray-500">{article.author}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-0.5">
            <Clock size={9} />
            {article.readTime}
          </span>
          <span>{article.readCount.toLocaleString()}阅读</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const LiteratureHeroCard = ({ article, onClick }: CardProps) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative rounded-xl overflow-hidden cursor-pointer group min-h-[196px]"
  >
    <DiscoveryCoverImage
      article={article}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-amber-950/88 via-amber-900/40 to-amber-800/15" />
    <div className="absolute -right-4 -top-2 text-white/10 pointer-events-none">
      <Feather size={88} strokeWidth={1} />
    </div>
    <div className="relative z-10 p-4 flex flex-col justify-end min-h-[196px]">
      <span className="text-[10px] tracking-[0.15em] uppercase text-amber-200/75 font-serif mb-2">
        今日推荐
      </span>
      <h3 className="text-xl font-serif font-bold text-white leading-snug mb-2 line-clamp-2">
        {article.title}
      </h3>
      <p className="text-sm text-amber-50/90 font-serif leading-relaxed line-clamp-2 mb-3 italic">
        「{getArticleExcerpt(article, 64)}」
      </p>
      <div className="flex items-center justify-between gap-2 text-[10px] text-amber-200/85 font-medium">
        <span className="font-bold">{article.author}</span>
        <span className="shrink-0">
          {article.readTime} · {article.readCount.toLocaleString()}阅读
        </span>
      </div>
    </div>
  </motion.div>
);

const LiteratureTodayZoneHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-baseline justify-between gap-2 mb-3">
    <h3 className="text-xs font-black text-amber-700 leading-none">{title}</h3>
    <span className="text-[10px] font-medium text-amber-500/90 shrink-0">{subtitle}</span>
  </div>
);

const LiteratureFeedSection = ({
  articles,
  onArticleClick,
}: {
  articles: Article[];
  onArticleClick: (id: string) => void;
}) => {
  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    [articles]
  );
  const featuredArticle = sortedArticles[0];
  const archiveArticles = sortedArticles.slice(1);

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/35 to-white border border-amber-100 p-3.5 shadow-sm shadow-amber-500/5 mb-5">
        <LiteratureTodayZoneHeader title="✨ 今日佳文" subtitle="静下心来 · 读一篇" />
        {featuredArticle ? (
          <LiteratureHeroCard
            article={featuredArticle}
            onClick={() => onArticleClick(featuredArticle.id)}
          />
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">暂无佳文</p>
        )}
      </div>

      {archiveArticles.length > 0 && (
        <div>
          <LiteratureTodayZoneHeader title="📖 往期悦读" subtitle="经典节选 · 名家散文" />
          {archiveArticles.map(article => (
            <LiteratureCard
              key={article.id}
              article={article}
              onClick={() => onArticleClick(article.id)}
            />
          ))}
        </div>
      )}

      {sortedArticles.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">暂无美文内容</div>
      )}

      <div className="py-8 text-center">
        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">
          愿文字温暖你的每一天
        </span>
      </div>
    </div>
  );
};

// 4. 科普视频卡
const VideoCard = ({ article, onClick }: { article: Article; onClick: () => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer group"
  >
    <div className="relative w-full aspect-video overflow-hidden bg-gray-200">
      <DiscoveryCoverImage
        article={article}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* 时长角标 */}
      {article.videoCard && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
          {article.videoCard.duration}
        </div>
      )}
      {/* 播放按钮 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play size={16} className="text-emerald-600 ml-0.5" fill="currentColor" />
        </div>
      </div>
    </div>
    <div className="p-3">
      <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-1.5">
        {article.title}
      </h3>
      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <span>{article.author}</span>
        <span>·</span>
        {article.videoCard && <span>{article.videoCard.views}播放</span>}
        <Flame size={10} className="text-orange-400 ml-auto" />
      </div>
    </div>
  </motion.div>
);

// 5. 双语新知 — 类型配色
const BILINGUAL_TYPE_THEME: Record<
  BilingualCardType,
  { gradient: string; tabActive: string; tabIdle: string }
> = {
  '每日一词': {
    gradient: 'from-blue-500 to-blue-700',
    tabActive: 'bg-blue-500 text-white shadow-md shadow-blue-500/25',
    tabIdle: 'bg-blue-50 text-blue-700 border border-blue-100',
  },
  '双语资讯': {
    gradient: 'from-cyan-500 to-teal-600',
    tabActive: 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25',
    tabIdle: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
  },
};

const TODAY_CARD_METRICS = {
  hero: { radius: 'rounded-2xl', fill: true },
  side: { radius: 'rounded-xl', fill: true },
} as const;

const TodayBilingualCard = ({
  article,
  onClick,
  variant,
  hideTypeLabel = false,
  checkedIn = false,
}: {
  article: Article;
  onClick: () => void;
  variant: 'hero' | 'side';
  hideTypeLabel?: boolean;
  checkedIn?: boolean;
}) => {
  const bili = article.bilingualCard;
  if (!bili) return null;
  const theme = BILINGUAL_TYPE_THEME[bili.type];
  const isHero = variant === 'hero';
  const metrics = TODAY_CARD_METRICS[variant];

  return (
    <motion.div
      whileTap={{ scale: isHero ? 0.98 : 0.97 }}
      onClick={onClick}
      className={`
        w-full min-w-0 h-full flex-1 overflow-hidden cursor-pointer transition-transform
        ${metrics.radius}
        ${isHero
          ? 'shadow-[0_10px_28px_rgba(59,130,246,0.38)] ring-2 ring-white/80'
          : 'shadow-md'}
      `}
    >
      <div
        className={`
          relative overflow-hidden bg-gradient-to-br ${theme.gradient} w-full h-full min-h-[132px]
          flex flex-col min-w-0
          ${isHero ? 'px-3.5 py-3.5 gap-1.5' : 'px-3 py-2.5 gap-1'}
        `}
      >
        <DailyWordCheckInBackgroundMark
          checkedIn={checkedIn}
          tone="dark"
          size={isHero ? 'md' : 'sm'}
          className={isHero ? 'top-3 right-3' : 'top-2 right-2'}
        />
        {!hideTypeLabel && (
          <span
            className={`
              relative z-[1] text-white/90 font-black leading-none truncate shrink-0 tracking-wide
              ${isHero ? 'text-[11px]' : 'text-[9px]'}
            `}
          >
            {bili.type}
          </span>
        )}

        <div className={`relative z-[1] flex-1 flex flex-col justify-center min-h-0 ${isHero ? 'gap-1.5' : 'gap-0.5'}`}>
          <p
            className={`
              text-white font-black leading-none truncate tracking-tight
              ${isHero ? 'text-[22px]' : 'text-[14px]'}
            `}
          >
            {bili.english}
          </p>
          {bili.pronunciation && (
            <p className={`text-white/75 font-medium truncate ${isHero ? 'text-[10px]' : 'text-[9px]'}`}>
              {bili.pronunciation}
            </p>
          )}
          <p className={`text-white/85 truncate font-medium ${isHero ? 'text-[13px]' : 'text-[10px]'}`}>
            {bili.chinese}
          </p>
          {bili.exampleSentence && (
            <p className={`text-white/70 italic line-clamp-1 ${isHero ? 'text-[10px]' : 'text-[9px]'}`}>
              {bili.exampleSentence}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TodayBilingualPlaceholder = ({
  type,
  variant,
}: {
  type: BilingualCardType;
  variant: 'hero' | 'side';
}) => {
  const metrics = TODAY_CARD_METRICS[variant];
  return (
    <div
      className={`
        w-full flex items-center justify-center bg-gradient-to-br opacity-40
        ${BILINGUAL_TYPE_THEME[type].gradient}
        h-full min-h-[132px] ${metrics.radius}
      `}
    >
      <span className="text-white/80 text-[9px] font-bold text-center px-1">暂无</span>
    </div>
  );
};

const BilingualCard = ({
  article,
  onClick,
  compact = false,
  checkedIn = false,
}: {
  article: Article;
  onClick: () => void;
  compact?: boolean;
  checkedIn?: boolean;
}) => {
  const bili = article.bilingualCard;
  if (!bili || bili.type !== '每日一词') return null;

  const tagColors: Record<BilingualCardType, string> = {
    '每日一词': 'bg-blue-100 text-blue-700',
    '双语资讯': 'bg-cyan-100 text-cyan-700',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative bg-blue-50 rounded-2xl border-l-4 border-blue-400 shadow-sm overflow-hidden cursor-pointer
        w-full min-w-0 h-full
        ${compact ? 'mb-0' : 'mb-3'}
      `}
      onClick={onClick}
    >
      <DailyWordCheckInBackgroundMark checkedIn={checkedIn} variant={compact ? 'archive' : 'default'} tone="light" size="sm" />
      <div className={`relative z-[1] ${compact ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagColors[bili.type]}`}>
            {bili.type}
          </span>
          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
            {formatDailyWordDateLabel(article.publishDate)}
          </span>
        </div>

        <p className={`font-black text-blue-700 mb-0.5 truncate ${compact ? 'text-lg' : 'text-2xl'}`}>
          {bili.english}
        </p>
        {bili.pronunciation && (
          <p className={`text-slate-500 italic truncate ${compact ? 'text-[10px] mb-1' : 'text-xs mb-2'}`}>
            {bili.pronunciation}
          </p>
        )}
        <p className={`text-gray-700 font-medium truncate ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
          {bili.chinese}
        </p>
        {bili.exampleSentence && (
          <>
            <div className="h-px bg-blue-200 mb-2" />
            <p
              className={`text-gray-700 leading-relaxed italic ${
                compact ? 'text-[10px] line-clamp-2' : 'text-xs'
              }`}
            >
              {bili.exampleSentence}
            </p>
            {bili.exampleTranslation && !compact && (
              <p className="text-xs text-gray-500 mt-1">{bili.exampleTranslation}</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

const BilingualTodayZoneHeader = ({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: 'word' | 'news';
}) => (
  <div className="flex items-baseline justify-between gap-2 mb-3">
    <h3
      className={`text-xs font-black leading-none ${
        tone === 'word' ? 'text-blue-600' : 'text-cyan-700'
      }`}
    >
      {title}
    </h3>
    <span
      className={`text-[10px] font-medium shrink-0 ${
        tone === 'word' ? 'text-blue-400' : 'text-cyan-500'
      }`}
    >
      {subtitle}
    </span>
  </div>
);

const BilingualFeedSection = ({
  articles,
  onArticleClick,
  showArchive = true,
}: {
  articles: Article[];
  onArticleClick: (id: string) => void;
  showArchive?: boolean;
}) => {
  const [subTab, setSubTab] = useState<BilingualCardType>('每日一词');
  const todayMap = useMemo(() => getTodayBilingualByType(), []);
  const checkedInIds = useDailyWordCheckIns();

  const archiveArticles = useMemo(() => {
    let list = articles.filter(
      a =>
        a.bilingualCard?.type === subTab && !isBilingualToday(a.publishDate)
    );
    if (subTab === '每日一词') {
      list = list.filter(a => isWithinDailyWordArchiveWindow(a.publishDate));
    }
    return list.sort(
      (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
    );
  }, [articles, subTab]);

  const wordOfDay = todayMap['每日一词'];
  const todayNews = todayMap['双语资讯'];

  return (
    <div>
      <div className={showArchive ? 'mb-5' : 'mb-0'}>
        {showArchive ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/40 to-white border border-blue-100 p-3.5 shadow-sm shadow-blue-500/5">
              <BilingualTodayZoneHeader
                title="📘 今日单词"
                subtitle="每天学一点 · 积累看得见"
                tone="word"
              />
              <div className="w-full min-w-0">
                {wordOfDay ? (
                  <TodayBilingualCard
                    article={wordOfDay}
                    variant="hero"
                    hideTypeLabel
                    checkedIn={checkedInIds.has(wordOfDay.id)}
                    onClick={() => onArticleClick(wordOfDay.id)}
                  />
                ) : (
                  <TodayBilingualPlaceholder type="每日一词" variant="hero" />
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-cyan-50/90 via-teal-50/30 to-white border border-cyan-100 p-3.5 shadow-sm shadow-cyan-500/5">
              <BilingualTodayZoneHeader
                title="📰 今日双语资讯"
                subtitle="读一条 · 学表达"
                tone="news"
              />
              <div className="w-full min-w-0">
                {todayNews ? (
                  <ContentFeedCard
                    article={todayNews}
                    embedded
                    onClick={() => onArticleClick(todayNews.id)}
                  />
                ) : (
                  <div className="w-full flex items-center justify-center bg-white/70 rounded-xl border border-dashed border-cyan-200 min-h-[96px]">
                    <span className="text-cyan-400/80 text-[10px] font-bold">暂无双语资讯</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full min-w-0">
            {wordOfDay ? (
              <TodayBilingualCard
                article={wordOfDay}
                variant="hero"
                hideTypeLabel
                checkedIn={checkedInIds.has(wordOfDay.id)}
                onClick={() => onArticleClick(wordOfDay.id)}
              />
            ) : (
              <TodayBilingualPlaceholder type="每日一词" variant="hero" />
            )}
          </div>
        )}
      </div>

      {showArchive && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {BILINGUAL_CARD_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSubTab(type)}
                className={`
                  shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all
                  ${subTab === type ? BILINGUAL_TYPE_THEME[type].tabActive : BILINGUAL_TYPE_THEME[type].tabIdle}
                `}
              >
                {type}
              </button>
            ))}
          </div>

          {archiveArticles.length > 0 ? (
            subTab === '双语资讯' ? (
              <div className="flex flex-col">
                {archiveArticles.map(article => (
                  <ContentFeedCard
                    key={article.id}
                    article={article}
                    onClick={() => onArticleClick(article.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {archiveArticles.map(article => (
                  <BilingualCard
                    key={article.id}
                    article={article}
                    compact
                    checkedIn={checkedInIds.has(article.id)}
                    onClick={() => onArticleClick(article.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">
              该分类暂无更多往期内容
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 6. 素养成长卡片
const WellnessCard = ({
  article,
  onClick,
  variant = 'default',
  embedded = false,
}: {
  article: Article;
  onClick: () => void;
  variant?: 'default' | 'hero';
  embedded?: boolean;
}) => {
  const w = article.wellnessCard;
  const isHero = variant === 'hero';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-gradient-to-r from-violet-50 to-white rounded-2xl border border-violet-100 shadow-sm cursor-pointer group overflow-hidden${
        embedded ? '' : ' mb-3'
      }`}
    >
      <div className={`flex items-start gap-4 ${isHero ? 'p-5' : 'p-4'}`}>
        <div
          className={`shrink-0 rounded-xl ${w?.colorClass || 'bg-violet-500'} flex items-center justify-center shadow-sm ${
            isHero ? 'w-14 h-14 text-3xl' : 'w-12 h-12 text-2xl'
          }`}
        >
          {w?.icon || '📖'}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-bold text-gray-800 leading-snug line-clamp-2 mb-1 ${
              isHero ? 'text-base' : 'text-sm'
            }`}
          >
            {article.title}
          </h3>
          <p
            className={`text-gray-500 line-clamp-2 leading-relaxed mb-2 ${
              isHero ? 'text-sm' : 'text-xs'
            }`}
          >
            {getArticleExcerpt(article, isHero ? 88 : 64)}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <Clock3 size={10} />
                {article.readTime}
              </span>
              {w?.gradeRange && (
                <span className="flex items-center gap-1">
                  <Target size={10} />
                  {w.gradeRange}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-violet-600 group-hover:translate-x-0.5 transition-transform shrink-0">
              开始阅读 →
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ======================================================================
// 首页 Feed 子区块组件
// ======================================================================

// 7. 紧凑三列视频卡（首页 / 科普探秘视频区通用）
const CompactVideoCard = ({ article, onClick }: CardProps) => {
  const views = getVideoViewsLabel(article);
  const duration = getVideoDurationLabel(article);
  const author = getVideoAuthorLabel(article);

  return (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className="w-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer group min-w-0"
  >
    <div className="relative w-full aspect-[2/1] overflow-hidden bg-gray-200">
      <DiscoveryCoverImage
        article={article}
        portrait={isPortraitVideoArticle(article)}
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />
      {duration && (
        <div className="absolute top-1 right-1.5 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
          {duration}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-white/25 border border-white/70 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
          <Play size={10} className="text-white ml-0.5" fill="currentColor" />
        </div>
      </div>
      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-end justify-between gap-1 text-[8px] font-bold text-white/90 min-w-0">
        <span className="truncate min-w-0">{author}</span>
        {views && <span className="shrink-0">{views}阅读</span>}
      </div>
    </div>
    <div className="p-1.5">
      <h3 className="font-bold text-gray-800 text-[10px] leading-snug line-clamp-2 mb-0.5">
        {article.title}
      </h3>
      <p className="text-[9px] text-gray-400">{formatPublishDateLabel(article.publishDate)}</p>
    </div>
  </motion.div>
  );
};

// 8. 竖版短视频卡（9:16，首页短视频科普专用）
const ShortVideoCard = ({ article, onClick }: CardProps) => {
  const sv = article.shortVideo;
  const duration = getVideoDurationLabel(article);
  const views = sv?.views ?? getVideoViewsLabel(article);
  const author = sv?.author ?? article.author;

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer relative group bg-gray-200"
      style={{ aspectRatio: '9/16' }}
    >
      <DiscoveryCoverImage
        article={article}
        portrait
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      {duration && (
        <div className="absolute top-2 right-2 bg-black/55 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
          {duration}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-9 h-9 rounded-full bg-white/25 border-2 border-white/70 flex items-center justify-center backdrop-blur-sm">
          <Play size={14} className="text-white ml-0.5" fill="currentColor" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className="text-white/85 text-[9px] font-bold truncate min-w-0">{author}</p>
          {views && (
            <p className="text-white/75 text-[9px] font-bold shrink-0">{views}阅读</p>
          )}
        </div>
        <p className="text-white text-[10px] font-bold leading-tight line-clamp-2">{article.title}</p>
      </div>
    </motion.div>
  );
};

const NewsTodayZoneHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-baseline justify-between gap-2 mb-3">
    <h3 className="text-xs font-black text-red-600 leading-none">{title}</h3>
    <span className="text-[10px] font-medium text-red-400 shrink-0">{subtitle}</span>
  </div>
);

const NewsFeedSection = ({
  articles,
  refreshKey,
  onArticleClick,
  onHotVideoPlay,
}: {
  articles: Article[];
  refreshKey: string;
  onArticleClick: (id: string) => void;
  onHotVideoPlay: (id: string, videos: Article[]) => void;
}) => {
  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    [articles]
  );
  const latestArticle = sortedArticles[0];

  const hotSpotItems = useMemo(
    () =>
      pickNewsHotSpotItems(
        MOCK_ARTICLES,
        4,
        latestArticle ? [latestArticle.id] : []
      ),
    [latestArticle?.id, refreshKey]
  );

  const restArticles = sortedArticles.slice(1);

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-rose-50 via-red-50/40 to-white border border-red-100 p-3.5 shadow-sm shadow-red-500/5 mb-5">
        <NewsTodayZoneHeader title="📡 今日要闻" subtitle="最新一条 · 抢先知晓" />
        {latestArticle ? (
          <ContentFeedCard
            embedded
            article={latestArticle}
            onClick={() => onArticleClick(latestArticle.id)}
          />
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">暂无要闻</p>
        )}
      </div>

      {hotSpotItems.length > 0 && (
        <div className="mb-5">
          <NewsTodayZoneHeader title="🔥 热门精选" subtitle="短视频 · 大家都在看" />
          <div className="grid grid-cols-4 gap-2">
            {hotSpotItems.map((item, index) => (
              <ShortVideoCard
                key={`${item.id}-${index}`}
                article={item}
                onClick={() => onHotVideoPlay(item.id, hotSpotItems)}
              />
            ))}
          </div>
        </div>
      )}

      {restArticles.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-gray-500 mb-3">📋 更多资讯</h3>
          {restArticles.map(article => (
            <ContentFeedCard
              key={article.id}
              article={article}
              onClick={() => onArticleClick(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ScienceTodayZoneHeader = ({
  title,
  subtitle,
  tone = 'emerald',
}: {
  title: string;
  subtitle: string;
  tone?: 'emerald' | 'teal';
}) => (
  <div className="flex items-baseline justify-between gap-2 mb-3">
    <h3
      className={`text-xs font-black leading-none ${
        tone === 'teal' ? 'text-teal-700' : 'text-emerald-600'
      }`}
    >
      {title}
    </h3>
    <span
      className={`text-[10px] font-medium shrink-0 ${
        tone === 'teal' ? 'text-teal-500' : 'text-emerald-400'
      }`}
    >
      {subtitle}
    </span>
  </div>
);

const ScienceFeedSection = ({
  textArticles,
  shortVideos,
  landscapeVideos,
  onArticleClick,
  onShortVideoPlay,
  onLandscapeVideoPlay,
}: {
  textArticles: Article[];
  shortVideos: Article[];
  landscapeVideos: Article[];
  onArticleClick: (id: string) => void;
  onShortVideoPlay: (id: string, videos: Article[]) => void;
  onLandscapeVideoPlay: (id: string, videos: Article[]) => void;
}) => {
  const sortedTextArticles = useMemo(
    () =>
      [...textArticles].sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    [textArticles]
  );
  const latestText = sortedTextArticles[0];
  const restTextArticles = sortedTextArticles.slice(1);

  const sortedShortVideos = useMemo(
    () =>
      [...shortVideos].sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    [shortVideos]
  );

  const sortedLandscapeVideos = useMemo(
    () =>
      [...landscapeVideos].sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    [landscapeVideos]
  );

  const shortVideoCols = Math.min(sortedShortVideos.length, 5);

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/40 to-white border border-emerald-100 p-3.5 shadow-sm shadow-emerald-500/5 mb-5">
        <ScienceTodayZoneHeader title="📚 今日科普" subtitle="最新一条 · 涨知识" />
        {latestText ? (
          <ContentFeedCard
            embedded
            article={latestText}
            onClick={() => onArticleClick(latestText.id)}
          />
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">暂无图文科普</p>
        )}
      </div>

      {sortedShortVideos.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-white border border-emerald-100/80 p-3.5 shadow-sm shadow-emerald-500/5 mb-5">
          <ScienceTodayZoneHeader title="📱 短视频科普" subtitle="先看短的 · 更好玩" />
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${shortVideoCols}, 1fr)` }}
          >
            {sortedShortVideos.map(article => (
              <ShortVideoCard
                key={article.id}
                article={article}
                onClick={() => onShortVideoPlay(article.id, sortedShortVideos)}
              />
            ))}
          </div>
        </div>
      )}

      {sortedLandscapeVideos.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-white border border-teal-100 p-3.5 shadow-sm shadow-teal-500/5 mb-5">
          <ScienceTodayZoneHeader
            title="🎬 科普视频"
            subtitle="涨知识 · 开眼界"
            tone="teal"
          />
          <div className="grid grid-cols-3 gap-2">
            {sortedLandscapeVideos.map(article => (
              <CompactVideoCard
                key={article.id}
                article={article}
                onClick={() => onLandscapeVideoPlay(article.id, sortedLandscapeVideos)}
              />
            ))}
          </div>
        </div>
      )}

      {restTextArticles.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-gray-500 mb-3">📖 图文科普</h3>
          {restTextArticles.map(article => (
            <ContentFeedCard
              key={article.id}
              article={article}
              onClick={() => onArticleClick(article.id)}
            />
          ))}
        </div>
      )}

      {sortedShortVideos.length === 0 &&
        sortedLandscapeVideos.length === 0 &&
        sortedTextArticles.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">暂无科普内容</div>
        )}

      <div className="py-8 text-center">
        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">
          发现更大的世界
        </span>
      </div>
    </div>
  );
};

const CampusTodayZoneHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-baseline justify-between gap-2 mb-3">
    <h3 className="text-xs font-black text-sky-600 leading-none">{title}</h3>
    <span className="text-[10px] font-medium text-sky-400 shrink-0">{subtitle}</span>
  </div>
);

const CampusFeedSection = ({
  articles,
  onArticleClick,
}: {
  articles: Article[];
  onArticleClick: (id: string) => void;
}) => {
  const sortedByRecency = useMemo(
    () =>
      [...articles].sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    [articles]
  );
  const latestArticle = sortedByRecency[0];

  const hotArticles = useMemo(() => {
    const excludeId = latestArticle?.id;
    return [...articles]
      .filter(a => a.id !== excludeId)
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 4);
  }, [articles, latestArticle?.id]);

  const hotIds = useMemo(() => new Set(hotArticles.map(a => a.id)), [hotArticles]);
  const storyArticles = useMemo(
    () =>
      sortedByRecency.filter(a => a.id !== latestArticle?.id && !hotIds.has(a.id)),
    [sortedByRecency, latestArticle?.id, hotIds]
  );

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50/35 to-white border border-sky-100 p-3.5 shadow-sm shadow-sky-500/5 mb-5">
        <CampusTodayZoneHeader title="🏫 今日校园" subtitle="最新一条 · 校内快讯" />
        {latestArticle ? (
          <ContentFeedCard
            embedded
            article={latestArticle}
            onClick={() => onArticleClick(latestArticle.id)}
          />
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">暂无校园快讯</p>
        )}
      </div>

      {hotArticles.length > 0 && (
        <div className="mb-5">
          <CampusTodayZoneHeader title="🔥 校园热点" subtitle="大家都在看 · 左右滑动" />
          <TabHotScroll
            articles={hotArticles}
            onArticleClick={onArticleClick}
            label=""
            showSectionHeader={false}
          />
        </div>
      )}

      {storyArticles.length > 0 && (
        <div>
          <CampusTodayZoneHeader title="📸 校园故事" subtitle="校内新鲜事 · 看图浏览" />
          <MasonryWaterfall articles={storyArticles} onArticleClick={onArticleClick} />
        </div>
      )}

      {sortedByRecency.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">暂无校园内容</div>
      )}

      <div className="py-8 text-center">
        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">
          校园故事，未完待续
        </span>
      </div>
    </div>
  );
};

const WellnessSectionBlockHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="mb-3">
    <h3 className="text-sm font-black text-gray-800">{title}</h3>
    <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
  </div>
);

const WellnessWireCard = ({
  article,
  onClick,
  variant = 'titled',
}: {
  article: Article;
  onClick: () => void;
  variant?: 'titled' | 'compact';
}) => {
  const durationLabel = isPlayableVideoArticle(article)
    ? getVideoDurationLabel(article)
    : article.readTime;
  const isVideo = isPlayableVideoArticle(article);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex gap-3 p-3 mb-3 last:mb-0 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer active:bg-gray-100/80 transition-colors"
    >
      <div className="flex-1 flex flex-col min-w-0 min-h-[108px]">
        {variant === 'titled' ? (
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="flex-1 min-w-0 font-bold text-gray-800 text-sm leading-snug line-clamp-2">
              {article.title}
            </h3>
            <span className="shrink-0 text-[10px] text-gray-400">
              {formatPublishDateLabel(article.publishDate)}
            </span>
          </div>
        ) : (
          <div className="flex justify-end mb-2">
            <span className="text-[10px] text-gray-400">
              {formatPublishDateLabel(article.publishDate)}
            </span>
          </div>
        )}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-2">
          {getArticleExcerpt(article, variant === 'titled' ? 84 : 96)}
        </p>
        <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400 font-medium mt-auto">
          <span className="truncate min-w-0">{article.author}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span>{article.readCount.toLocaleString()}阅读</span>
            <span className="flex items-center gap-0.5">
              <Heart size={9} className="text-rose-400" />
              {formatArticleLikesLabel(article)}
            </span>
          </div>
        </div>
      </div>
      <div className="relative w-[108px] h-[108px] shrink-0 rounded-lg overflow-hidden bg-gray-200">
        <DiscoveryCoverImage
          article={article}
          portrait={isPortraitVideoArticle(article)}
          className="w-full h-full object-cover"
        />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-white/30 border border-white/70 flex items-center justify-center">
              <Play size={12} className="text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        <div className="absolute top-1 right-1 bg-black/55 text-white text-[8px] font-bold px-1 py-0.5 rounded">
          {durationLabel}
        </div>
      </div>
    </motion.div>
  );
};

const WellnessFeedSection = ({
  articles,
  onArticleClick,
  onVideoPlay,
}: {
  articles: Article[];
  onArticleClick: (id: string) => void;
  onVideoPlay: (id: string, videos: Article[]) => void;
}) => {
  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    [articles]
  );

  const textArticles = useMemo(
    () => sortedArticles.filter(a => !isPlayableVideoArticle(a)),
    [sortedArticles]
  );
  const featuredArticle = textArticles[0];
  const guideArticles = textArticles.slice(1);

  const videoArticles = useMemo(
    () => sortedArticles.filter(a => isPlayableVideoArticle(a)),
    [sortedArticles]
  );

  return (
    <div>
      <div className="rounded-2xl border border-violet-100 bg-white p-3.5 shadow-sm mb-5">
        <WellnessSectionBlockHeader title="🌱 今日成长" subtitle="每天进步一点点" />
        {featuredArticle ? (
          <WellnessWireCard
            variant="titled"
            article={featuredArticle}
            onClick={() => onArticleClick(featuredArticle.id)}
          />
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">暂无成长内容</p>
        )}
      </div>

      {videoArticles.length > 0 && (
        <div className="rounded-2xl border border-violet-100 bg-white p-3.5 shadow-sm mb-5">
          <WellnessSectionBlockHeader title="🎬 轻课视频" subtitle="短课精讲 · 轻松学" />
          {videoArticles.map(article => (
            <WellnessWireCard
              key={article.id}
              variant="titled"
              article={article}
              onClick={() => onVideoPlay(article.id, videoArticles)}
            />
          ))}
        </div>
      )}

      {guideArticles.length > 0 && (
        <div className="rounded-2xl border border-violet-100 bg-white p-3.5 shadow-sm mb-5">
          <WellnessSectionBlockHeader title="📚 成长指南" subtitle="学习方法 · 心理成长" />
          {guideArticles.map(article => (
            <WellnessWireCard
              key={article.id}
              variant="compact"
              article={article}
              onClick={() => onArticleClick(article.id)}
            />
          ))}
        </div>
      )}

      {sortedArticles.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">暂无成长内容</div>
      )}

      <div className="py-8 text-center">
        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">
          持续成长，成为更好的自己
        </span>
      </div>
    </div>
  );
};

const BODY_PREVIEW_COLLAPSE_LEN = 56;

// 9. 竖屏沉浸式视频播放器（抖音式，横屏视频留黑边）
interface VideoFeedPlayerProps {
  videos: Article[];
  startIndex: number;
  onClose: () => void;
  onExpandArticle: (articleId: string) => void;
}
const VideoFeedPlayer: React.FC<VideoFeedPlayerProps> = ({ videos, startIndex, onClose, onExpandArticle }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [favorited, setFavorited] = useState<Record<number, boolean>>({});
  const current = videos[currentIndex];
  const isPortrait = isPortraitVideoArticle(current);
  const bodyText = getArticleBodyPlainText(current);
  const showExpand = bodyText.length > BODY_PREVIEW_COLLAPSE_LEN;

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, videos]);

  const goNext = () => { if (currentIndex < videos.length - 1) setCurrentIndex(i => i + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(i => i - 1); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[300] flex flex-col select-none"
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-5 pb-3 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
          <X size={18} />
        </button>
        <p className="text-white text-sm font-bold">视频</p>
        <div className="w-9 h-9" />
      </div>

      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y < -60) goNext();
              else if (info.offset.y > 60) goPrev();
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing bg-black flex items-center justify-center"
          >
            <DiscoveryCoverImage
              article={current}
              portrait={isPortrait}
              className={`max-w-full max-h-full ${isPortrait ? 'w-full h-full object-cover' : 'w-full h-full object-contain'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute right-3 bottom-48 flex flex-col items-center gap-5 z-10">
        <button
          onClick={() => setLiked(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${liked[currentIndex] ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'}`}>
            <Heart size={20} className="text-white" fill={liked[currentIndex] ? 'white' : 'none'} />
          </div>
          <span className="text-white text-[10px] font-bold">{getVideoLikesLabel(current)}</span>
        </button>
        <button
          onClick={() => setFavorited(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${favorited[currentIndex] ? 'bg-amber-500' : 'bg-white/20 backdrop-blur-sm'}`}>
            <Star size={20} className="text-white" fill={favorited[currentIndex] ? 'white' : 'none'} />
          </div>
          <span className="text-white text-[10px] font-bold">{getVideoFavoritesLabel(current)}</span>
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-16 z-10 px-4 pb-8 pt-4">
        <p className="text-white/55 text-[10px] font-medium mb-1.5">
          {formatPublishDateLabel(current.publishDate)}
        </p>
        <p className="text-white font-bold text-sm mb-1">{getVideoAuthorLabel(current)}</p>
        <p className="text-white font-bold text-sm leading-snug mb-1.5">{current.title}</p>
        {bodyText && (
          <div className="mb-2">
            <p className="text-white/85 text-xs leading-relaxed line-clamp-2">{bodyText}</p>
            {showExpand && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onExpandArticle(current.id); }}
                className="mt-1 text-sky-300 text-xs font-bold"
              >
                展开
              </button>
            )}
          </div>
        )}
        {getVideoViewsLabel(current) && (
          <p className="text-white/60 text-[10px] font-medium mb-1">{getVideoViewsLabel(current)}播放</p>
        )}
        {current.shortVideo?.tags && (
          <div className="flex gap-2 flex-wrap">
            {current.shortVideo.tags.map(tag => (
              <span key={tag} className="text-sky-300 text-[11px] font-bold">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
        {videos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-1 rounded-full transition-all ${i === currentIndex ? 'h-6 bg-white' : 'h-2 bg-white/40'}`}
          />
        ))}
      </div>

      {videos.length > 1 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 text-white/40 text-[10px]">
          上下滑动切换
        </div>
      )}
    </motion.div>
  );
};

// 首页头条轮播 Banner
const HomeFeaturedCarousel = ({ articles, onArticleClick }: { articles: Article[]; onArticleClick: (id: string) => void }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev: number) => (prev + 1) % articles.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [articles.length]);

  const article = articles[idx];
  const excerpt = getArticleExcerpt(article, 80);

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h2 className="font-black text-gray-800 text-base leading-tight">🔥 头条推荐</h2>
          <p className="text-xs text-gray-400 mt-0.5">今日要闻 · 精选</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pt-1">
          {articles.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 条`}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${
                i === idx
                  ? 'w-2 h-2 bg-gray-500'
                  : 'w-2 h-2 border border-gray-300 bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onArticleClick(article.id)}
          className="relative w-full rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-gray-100 flex items-stretch min-h-[120px] bg-white"
        >
          <div className="w-[38%] max-w-[140px] shrink-0 overflow-hidden bg-gray-100">
            <DiscoveryCoverImage article={article} className="w-full h-full min-h-[120px] object-cover" />
          </div>
          <div className="flex-1 px-3.5 py-3 flex flex-col justify-between min-w-0">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1.5 min-w-0">
              <h3 className="flex-1 min-w-0 font-bold text-gray-800 text-xs leading-snug line-clamp-1">
                {article.title}
              </h3>
              <span className="shrink-0 truncate max-w-[4.5rem] text-gray-400">{article.author}</span>
              <span className="shrink-0 text-gray-400">{formatPublishDateLabel(article.publishDate)}</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-2">
              {excerpt}
            </p>
            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {article.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Flame size={10} className="text-orange-400" />
                {article.readCount.toLocaleString()}阅读
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// 首页区块标题
const SectionHeader = ({ title, subtitle, onMore }: { title: string; subtitle?: string; onMore?: () => void }) => (
  <div className="flex items-center justify-between mb-3">
    <div>
      <h2 className="font-black text-gray-800 text-base">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {onMore && (
      <button onClick={onMore} className="flex items-center gap-0.5 text-xs text-indigo-500 font-bold">
        更多 <ChevronRight size={13} />
      </button>
    )}
  </div>
);

// Tab 热门横滚区（NEWS / SCIENCE / CAMPUS 顶部）
const TabHotScroll = ({
  articles,
  onArticleClick,
  label,
  showSectionHeader = true,
}: {
  articles: Article[];
  onArticleClick: (id: string) => void;
  label: string;
  showSectionHeader?: boolean;
}) => {
  if (articles.length === 0) return null;
  // 第1条是热度最高的（置顶），后面按发布时间取最新
  const hot = articles[0];
  const latest = articles.slice(1);

  const HotCard = ({ article, isTop }: { article: Article; isTop?: boolean }) => (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onArticleClick(article.id)}
      className="shrink-0 w-64 flex items-stretch h-[88px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer bg-white"
    >
      <div className="w-[72px] shrink-0 overflow-hidden relative">
        <DiscoveryCoverImage article={article} className="w-full h-full object-cover" />
        {isTop && (
          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
            HOT
          </div>
        )}
      </div>
      <div className="flex-1 px-3 py-2.5 flex flex-col justify-between min-w-0">
        <p className="font-bold text-gray-800 text-xs leading-snug line-clamp-2">{article.title}</p>
        <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
          <Flame size={9} className="text-orange-400 shrink-0" />
          <span>{article.readCount.toLocaleString()}</span>
          <span className="ml-auto truncate">{article.publishDate}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`${showSectionHeader ? 'mb-5' : 'mb-0'} -mx-4 px-4`}>
      {showSectionHeader && (
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{label}</p>
          <span className="text-[10px] text-gray-300">← 左右滑动</span>
        </div>
      )}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        <HotCard article={hot} isTop />
        {latest.map(a => <HotCard key={a.id} article={a} isTop={false} />)}
      </div>
    </div>
  );
};

// ======================================================================
// 爱心大使公益月报
// ======================================================================

const CharityMonthlyReportFeedSection = () => {
  const report = getPublishedMonthlyReport();
  const [rankTab, setRankTab] = useState<'all' | 'lastMonth'>('lastMonth');

  const formatNum = (n: number) => n.toLocaleString('zh-CN');

  const activeLeaderboard = useMemo(
    () =>
      rankTab === 'lastMonth'
        ? CHARITY_DONATION_LEADERBOARD_LAST_MONTH
        : CHARITY_DONATION_LEADERBOARD_ALL,
    [rankTab],
  );

  return (
    <div className="space-y-4">
      {/* 爱心公告栏横幅 */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-5 shadow-lg shadow-rose-200/50 overflow-hidden relative">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-4 bottom-0 w-24 h-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
            <Heart size={20} className="text-white fill-white/30" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white tracking-tight">爱心公告栏</h2>
            <p className="text-sm text-white/90 leading-relaxed mt-1.5 font-medium">
              你的捐赠金币汇聚成光，通晤纪配捐同行，让远方课堂更明亮。
            </p>
          </div>
        </div>
      </div>

      {/* 月报主卡 */}
      {report && (
        <div className="rounded-2xl overflow-hidden border border-rose-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 px-5 py-4 border-b border-rose-100/80 relative">
            <span className="absolute top-3 right-4 text-[10px] font-bold text-rose-400 bg-white/80 border border-rose-100 px-2.5 py-1 rounded-full">
              官方月报
            </span>
            <h3 className="text-base font-black text-rose-900 pr-20">{report.title}</h3>
            <p className="text-xs text-rose-600/80 mt-1.5 font-medium">
              数据周期：{report.period}
            </p>
            <p className="text-xs text-rose-500/70 mt-0.5 font-medium">
              {(() => {
                const [y, m, d] = report.publishTime.split('-');
                return y && m && d ? `${y}年${Number(m)}月${Number(d)}日发布` : report.publishTime;
              })()}
            </p>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 上月捐赠与参与数据 */}
            <div>
              <p className="text-xs font-black text-gray-500 mb-3 flex items-center gap-1.5">
                <FileText size={13} className="text-rose-400" />
                上月捐赠与参与数据
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-rose-50/80 border border-rose-100 p-3.5">
                  <div className="flex items-center gap-1.5 text-rose-500 mb-1.5">
                    <Coins size={14} />
                    <span className="text-[10px] font-bold">捐赠金币</span>
                  </div>
                  <p className="text-xl font-black text-rose-700 tabular-nums">{formatNum(report.donatedPoints)}</p>
                </div>
                <div className="rounded-xl bg-sky-50/80 border border-sky-100 p-3.5">
                  <div className="flex items-center gap-1.5 text-sky-500 mb-1.5">
                    <Users size={14} />
                    <span className="text-[10px] font-bold">参与人数</span>
                  </div>
                  <p className="text-xl font-black text-sky-700 tabular-nums">{formatNum(report.participants)}</p>
                </div>
                <div className="rounded-xl bg-violet-50/80 border border-violet-100 p-3.5">
                  <div className="flex items-center gap-1.5 text-violet-500 mb-1.5">
                    <HandHeart size={14} />
                    <span className="text-[10px] font-bold">通道配捐</span>
                  </div>
                  <p className="text-xl font-black text-violet-700 tabular-nums">¥{formatNum(report.matchYuan)}</p>
                </div>
                <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-3.5">
                  <div className="flex items-center gap-1.5 text-amber-600 mb-1.5">
                    <PiggyBank size={14} />
                    <span className="text-[10px] font-bold">爱心池余额</span>
                  </div>
                  <p className="text-xl font-black text-amber-700 tabular-nums">¥{formatNum(report.poolBalance)}</p>
                </div>
              </div>
            </div>

            {/* 捐赠金币排行 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-gray-500 flex items-center gap-1.5">
                  <Star size={13} className="text-amber-400 fill-amber-400/30" />
                  捐赠金币排行
                </p>
                <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                  {(['all', 'lastMonth'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRankTab(key)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                        rankTab === key
                          ? 'bg-white text-rose-600 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {key === 'all' ? '全部' : '上月'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium mb-2">
                {rankTab === 'lastMonth' ? '统计周期：上月（3月）' : '统计范围：累计至今'}
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={rankTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2"
                >
                  {activeLeaderboard.map((entry) => (
                    <div
                      key={`${rankTab}-${entry.rank}-${entry.name}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/80 border border-gray-100"
                    >
                      <span
                        className={`w-6 text-center text-xs font-black shrink-0 ${
                          entry.rank === 1
                            ? 'text-amber-500'
                            : entry.rank === 2
                              ? 'text-gray-400'
                              : entry.rank === 3
                                ? 'text-amber-700'
                                : 'text-gray-300'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-full ${entry.avatarBg} flex items-center justify-center text-base shrink-0 border-2 border-white shadow-sm`}
                      >
                        {entry.avatarEmoji}
                      </div>
                      <span className="flex-1 text-sm font-bold text-gray-700 truncate">{entry.name}</span>
                      <span className="text-sm font-black text-rose-500 tabular-nums">{entry.points}</span>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      <div className="py-6 text-center">
        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">
          爱心传递，持续更新
        </span>
      </div>
    </div>
  );
};

// 主页面组件
// ======================================================================

type TabKey = 'HOME' | 'NEWS' | 'BILINGUAL' | 'SCIENCE' | 'LIT' | 'WELLNESS' | 'CAMPUS' | 'CHARITY';

const TABS: { key: TabKey; label: string; icon: React.ElementType; activeColor: string }[] = [
  { key: 'HOME',      label: '首页',   icon: Sparkles,   activeColor: 'text-indigo-600' },
  { key: 'NEWS',      label: '时事速递', icon: Radio,     activeColor: 'text-red-500'   },
  { key: 'BILINGUAL', label: '双语新知', icon: Languages, activeColor: 'text-blue-600'  },
  { key: 'SCIENCE',   label: '科普探秘', icon: Telescope, activeColor: 'text-emerald-600'},
  { key: 'LIT',       label: '美文悦读', icon: BookOpen,  activeColor: 'text-amber-600' },
  { key: 'WELLNESS',  label: '素养成长', icon: Sprout,    activeColor: 'text-violet-600'},
  { key: 'CAMPUS',    label: '校园',   icon: School,     activeColor: 'text-sky-600'   },
  { key: 'CHARITY',   label: '公益月报', icon: Heart,    activeColor: 'text-rose-500'  },
];

const categoryMap: Record<TabKey, ArticleCategory | null> = {
  HOME:      null,
  NEWS:      'CURRENT_EVENTS',
  BILINGUAL: 'BILINGUAL',
  SCIENCE:   'SCIENCE',
  LIT:       'LITERATURE',
  WELLNESS:  'WELLNESS',
  CAMPUS:    'CAMPUS_NEWS',
  CHARITY:   null,
};

export const DiscoveryFullPage: React.FC<DiscoveryFullPageProps> = ({ onBack, onArticleClick }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('HOME');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchResultPage, setIsSearchResultPage] = useState(false);

  // 短视频播放器状态
  const [svPlayer, setSvPlayer] = useState<{ videos: Article[]; index: number } | null>(null);

  // 按 Tab 过滤文章（短视频不出现在 Tab 内容流中）
  const filteredArticles = useMemo(() => {
    let result = MOCK_ARTICLES.filter(a => !a.shortVideo?.isShort);
    const targetCategory = categoryMap[activeTab];
    if (targetCategory) {
      result = result.filter(a => a.category === targetCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        (a.blocks && a.blocks.some(b => b.content?.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [activeTab, searchQuery]);

  // 所有短视频
  const allShortVideos = useMemo(() => MOCK_ARTICLES.filter(a => a.shortVideo?.isShort), []);

  const allPlayableVideos = useMemo(
    () =>
      MOCK_ARTICLES.filter(isPlayableVideoArticle).sort(
        (a, b) => getArticleRecencyScore(b.publishDate) - getArticleRecencyScore(a.publishDate)
      ),
    []
  );

  const playVideoAt = (articleId: string, videos: Article[]) => {
    const index = videos.findIndex(v => v.id === articleId);
    if (index >= 0) setSvPlayer({ videos, index });
  };

  const handleExpandArticleFromVideo = (articleId: string) => {
    if (!svPlayer) return;
    const expandIndex = svPlayer.videos.findIndex(v => v.id === articleId);
    const resume = {
      videos: svPlayer.videos,
      index: expandIndex >= 0 ? expandIndex : svPlayer.index,
    };
    setSvPlayer(null);
    onArticleClick(articleId, {
      hideNav: true,
      onResumeVideoFeed: () => setSvPlayer(resume),
    });
  };

  const handleArticleClick = (articleId: string, options?: { hideNav?: boolean; onResumeVideoFeed?: () => void }) => {
    if (!options?.hideNav) {
      const article = MOCK_ARTICLES.find(a => a.id === articleId);
      if (article && isPlayableVideoArticle(article)) {
        playVideoAt(articleId, allPlayableVideos);
        return;
      }
    }
    onArticleClick(articleId, options);
  };

  // 搜索结果（全量内容，排除短视频）
  const searchResults = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return [];
    return MOCK_ARTICLES
      .filter(a => !a.shortVideo?.isShort)
      .filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        (a.blocks && a.blocks.some(b => b.content?.toLowerCase().includes(q)))
      );
  }, [searchKeyword]);

  // ---- 首页 Feed 渲染 ----
  const renderHomeFeed = () => {
    const bilingualArticlesAll = MOCK_ARTICLES.filter(a => a.category === 'BILINGUAL' && a.bilingualCard);
    // 头条轮播：从时事新闻取前5条按阅读量排序
    const newsForBanner = [...MOCK_ARTICLES]
      .filter(a => a.category === 'CURRENT_EVENTS')
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 5);
    const videoArticles = MOCK_ARTICLES.filter(a => a.videoCard?.isVideo).slice(0, 3);
    const newsArticlesPreview = MOCK_ARTICLES.filter(a => a.category === 'CURRENT_EVENTS').slice(0, 3);
    const shortVideosPreview = allShortVideos.slice(0, 5);
    const campusArticles = MOCK_ARTICLES.filter(a => a.category === 'CAMPUS_NEWS');
    const wellnessArticles = MOCK_ARTICLES.filter(a => a.category === 'WELLNESS');
    const litArticles = MOCK_ARTICLES.filter(a => a.category === 'LITERATURE');

    return (
      <div>
        {/* 1. 每日一词（首页仅今日单词卡） */}
        {bilingualArticlesAll.length > 0 && (
          <div className="mb-5">
            <SectionHeader title="🔤 每日一词" subtitle="今日单词" onMore={() => setActiveTab('BILINGUAL')} />
            <BilingualFeedSection
              articles={bilingualArticlesAll}
              onArticleClick={handleArticleClick}
              showArchive={false}
            />
          </div>
        )}

        {/* 2. 头条推荐 */}
        {newsForBanner.length > 0 && (
          <HomeFeaturedCarousel articles={newsForBanner} onArticleClick={handleArticleClick} />
        )}

        {/* 3. 短视频科普 */}
        {shortVideosPreview.length > 0 && (
          <div className="mb-5">
            <SectionHeader title="📱 短视频科普" subtitle="先看短的 · 更好玩" onMore={() => setActiveTab('SCIENCE')} />
            <div
              className="grid gap-2 pb-2"
              style={{ gridTemplateColumns: `repeat(${shortVideosPreview.length}, 1fr)` }}
            >
              {shortVideosPreview.map(a => (
                <ShortVideoCard
                  key={a.id}
                  article={a}
                  onClick={() => playVideoAt(a.id, allPlayableVideos)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 4. 爱心公益月报预览 */}
        <div className="mb-5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('CHARITY')}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab('CHARITY')}
            className="rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-4 shadow-md shadow-rose-200/40 cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Heart size={18} className="text-white fill-white/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white">爱心大使公益月报</p>
                <p className="text-[11px] text-white/85 mt-0.5 line-clamp-1">捐赠金币汇聚成光，配捐同行照亮远方课堂</p>
              </div>
              <ChevronRight size={18} className="text-white/70 shrink-0" />
            </div>
          </div>
        </div>

        {/* 5. 校园 */}
        {campusArticles.length > 0 && (
          <div className="mb-5">
            <SectionHeader title="🏫 校园" subtitle="校内新鲜事" onMore={() => setActiveTab('CAMPUS')} />
            <MasonryWaterfall
              articles={campusArticles.slice(0, 2)}
              onArticleClick={handleArticleClick}
              compactCover
            />
          </div>
        )}

        {/* 5. 科普视频 */}
        {videoArticles.length > 0 && (
          <div className="mb-5">
            <SectionHeader title="🎬 科普视频" subtitle="涨知识 · 开眼界" onMore={() => setActiveTab('SCIENCE')} />
            <div className="grid grid-cols-3 gap-2">
              {videoArticles.map(a => (
                <CompactVideoCard key={a.id} article={a} onClick={() => handleArticleClick(a.id)} />
              ))}
            </div>
          </div>
        )}

        {/* 6. 时事速递（首页仅预览 3 条） */}
        {newsArticlesPreview.length > 0 && (
          <div className="mb-5">
            <SectionHeader title="📡 时事速递" subtitle="今日要闻 · 精选" onMore={() => setActiveTab('NEWS')} />
            {newsArticlesPreview.map(a => (
              <ContentFeedCard key={a.id} article={a} onClick={() => handleArticleClick(a.id)} />
            ))}
          </div>
        )}

        {/* 7. 素养成长 */}
        {wellnessArticles.length > 0 && (
          <div className="mb-5">
            <SectionHeader title="🌱 素养成长" subtitle="学习方法 · 心理成长" onMore={() => setActiveTab('WELLNESS')} />
            <MasonryWaterfall
              articles={wellnessArticles.slice(0, 2)}
              onArticleClick={handleArticleClick}
              compactCover
            />
          </div>
        )}

        {/* 8. 美文悦读 */}
        {litArticles.length > 0 && (
          <div className="mb-5">
            <SectionHeader title="📖 美文悦读" subtitle="经典节选 · 名家散文" onMore={() => setActiveTab('LIT')} />
            {litArticles.slice(0, 3).map(a => (
              <ContentFeedCard key={a.id} article={a} onClick={() => handleArticleClick(a.id)} />
            ))}
          </div>
        )}

      </div>
    );
  };

  // ---- Tab 内容渲染 ----
  const renderContent = () => {
    if (activeTab === 'HOME') {
      return renderHomeFeed();
    }

    if (activeTab === 'CHARITY') {
      return <CharityMonthlyReportFeedSection />;
    }

    if (activeTab === 'SCIENCE') {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = (a: Article) =>
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        (a.blocks && a.blocks.some(b => b.content?.toLowerCase().includes(q)));

      const scienceShortVideos = allShortVideos.filter(matchSearch);
      const scienceLandscapeVideos = filteredArticles.filter(
        a => a.videoCard?.isVideo && !a.shortVideo?.isShort
      );
      const scienceTextArticles = filteredArticles.filter(a => !isPlayableVideoArticle(a));

      return (
        <ScienceFeedSection
          textArticles={scienceTextArticles}
          shortVideos={scienceShortVideos}
          landscapeVideos={scienceLandscapeVideos}
          onArticleClick={handleArticleClick}
          onShortVideoPlay={(id, videos) => playVideoAt(id, videos)}
          onLandscapeVideoPlay={(id, videos) => playVideoAt(id, videos)}
        />
      );
    }

    if (filteredArticles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-500">这里静悄悄的...</p>
          <p className="text-xs text-gray-400 mt-1">换个词搜搜看？</p>
        </div>
      );
    }

    // 校园 → 今日校园 + 校园热点 + 校园故事
    if (activeTab === 'CAMPUS') {
      return (
        <CampusFeedSection
          articles={filteredArticles}
          onArticleClick={handleArticleClick}
        />
      );
    }

    // 时事速递 → 今日要闻 + 热门精选 + 更多资讯
    if (activeTab === 'NEWS') {
      const newsTextArticles = filteredArticles.filter(a => !isPlayableVideoArticle(a));
      return (
        <div>
          <NewsFeedSection
            articles={newsTextArticles}
            refreshKey={activeTab}
            onArticleClick={handleArticleClick}
            onHotVideoPlay={(id, videos) => playVideoAt(id, videos)}
          />
          <div className="py-8 text-center">
            <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">休息一下，思考更重要</span>
          </div>
        </div>
      );
    }

    // 双语新知 → 今日双卡 + 分类往期列表
    if (activeTab === 'BILINGUAL') {
      return (
        <div>
          <BilingualFeedSection
            articles={filteredArticles.filter(a => a.bilingualCard)}
            onArticleClick={handleArticleClick}
          />
          <div className="py-8 text-center">
            <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Keep learning every day</span>
          </div>
        </div>
      );
    }

    // 美文悦读 → 今日佳文 + 往期悦读
    if (activeTab === 'LIT') {
      return (
        <LiteratureFeedSection
          articles={filteredArticles}
          onArticleClick={handleArticleClick}
        />
      );
    }

    // 素养成长 → 今日成长 + 轻课视频 + 成长指南
    if (activeTab === 'WELLNESS') {
      return (
        <WellnessFeedSection
          articles={filteredArticles}
          onArticleClick={handleArticleClick}
          onVideoPlay={(id, videos) => playVideoAt(id, videos)}
        />
      );
    }

    return null;
  };

  const executeSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchKeyword(q);
    setIsSearchResultPage(true);
  };

  const exitSearchResultPage = () => {
    setIsSearchResultPage(false);
    setSearchKeyword('');
    setSearchQuery('');
  };

  const activeTabConfig = TABS.find(t => t.key === activeTab);

  if (isSearchResultPage) {
    return (
      <div className="w-full h-full bg-slate-50 flex flex-col">
        <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
          <div className="px-4 h-14 flex items-center gap-2">
            <button
              onClick={exitSearchResultPage}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') executeSearch();
                }}
                placeholder="搜索..."
                className="h-8 flex-1 bg-gray-100 rounded-full px-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />
              <button
                onClick={executeSearch}
                className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors"
              >
                <Search size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`search-${searchKeyword}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">没有找到相关内容</p>
                  <p className="text-xs text-gray-400 mt-1">试试换个关键词</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    共 {searchResults.length} 条结果
                  </p>
                  {searchResults.map(article => (
                    <ListItemCard key={article.id} article={article} onClick={() => handleArticleClick(article.id)} />
                  ))}
                  <div className="py-8 text-center">
                    <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">以上为全部搜索结果</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="h-20" />
        </div>

        <AnimatePresence>
          {svPlayer && (
            <VideoFeedPlayer
              videos={svPlayer.videos}
              startIndex={svPlayer.index}
              onClose={() => setSvPlayer(null)}
              onExpandArticle={handleExpandArticleFromVideo}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col">

      {/* Sticky Header */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-black text-gray-900">万象视界</h1>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 160, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') executeSearch();
                  }}
                  placeholder="搜索..."
                  className="h-8 bg-gray-100 rounded-full px-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  autoFocus
                />
              )}
            </AnimatePresence>
            <button
              onClick={() => {
                if (!isSearchExpanded) {
                  setIsSearchExpanded(true);
                  return;
                }

                if (searchQuery.trim()) {
                  executeSearch();
                  return;
                }

                setIsSearchExpanded(false);
                setSearchQuery('');
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isSearchExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Category Tabs (可横向滚动) */}
        <div className="px-2 pb-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 p-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setIsSearchResultPage(false);
                  }}
                  className={`
                    relative px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all duration-300
                    ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-white shadow-sm border border-gray-100 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon size={13} className={isActive ? tab.activeColor : 'text-current'} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={isSearchResultPage ? `search-${searchKeyword}` : activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
        <div className="h-20" />
      </div>

      {/* 竖屏视频播放器 */}
      <AnimatePresence>
        {svPlayer && (
          <VideoFeedPlayer
            videos={svPlayer.videos}
            startIndex={svPlayer.index}
            onClose={() => setSvPlayer(null)}
            onExpandArticle={handleExpandArticleFromVideo}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
