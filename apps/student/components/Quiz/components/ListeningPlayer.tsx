import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Loader2, Captions, Gauge, Sparkles } from 'lucide-react';

type ListeningMode = 'practice' | 'exam' | 'mistake_review' | 'analysis' | 'browse';

interface ListeningExamRules {
    allowSeek?: boolean;
    maxReplays?: number | null;
    subtitlesAllowed?: boolean;
}

interface ListeningPlayerProps {
    audioUrl: string;
    transcript?: string;
    mode: ListeningMode;
    themeColor?: string;
    examRules?: ListeningExamRules;
    title?: string;
}

const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const ListeningPlayer: React.FC<ListeningPlayerProps> = ({
    audioUrl,
    transcript,
    mode,
    themeColor = 'indigo',
    examRules,
    title = '听力音频',
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showTranscript, setShowTranscript] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [replaysLeft, setReplaysLeft] = useState<number | null>(null);
    const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
    const speedMenuRef = useRef<HTMLDivElement | null>(null);

    const isExam = mode === 'exam';
    const isPractice = mode === 'practice';
    const isStrictMode = isExam || isPractice;
    const allowSeek = examRules?.allowSeek ?? !isExam;
    const maxReplays = examRules?.maxReplays ?? (isExam ? 1 : null);
    const subtitlesAllowed = examRules?.subtitlesAllowed ?? !isExam;

    const finiteReplays = useMemo(
        () => (maxReplays === null || maxReplays === undefined ? null : maxReplays),
        [maxReplays]
    );

    useEffect(() => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        setIsPlaying(false);
        setIsLoading(true);
        setCurrentTime(0);
        setDuration(0);
        setError(null);
        setReplaysLeft(finiteReplays ?? null);
        audio.playbackRate = speed;

        const handleLoaded = () => {
            setDuration(audio.duration || 0);
            setIsLoading(false);
        };
        const handleCanPlay = () => setIsLoading(false);
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(audio.duration || 0);
        };
        const handleWaiting = () => setIsLoading(true);
        const handleError = () => {
            setError('音频加载失败，请重试');
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener('loadedmetadata', handleLoaded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('error', handleError);

        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', handleLoaded);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('error', handleError);
        };
    }, [audioUrl, finiteReplays, speed]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, [speed]);

    // 点击外部关闭倍速下拉
    useEffect(() => {
        if (!isSpeedMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
                setIsSpeedMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSpeedMenuOpen]);

    const handlePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            return;
        }

        const isStartFromBeginning = audio.currentTime === 0 || audio.ended;
        if (finiteReplays !== null && isStartFromBeginning && (replaysLeft ?? 0) <= 0) {
            setError('播放次数已用完');
            return;
        }

        if (finiteReplays !== null && isStartFromBeginning) {
            setReplaysLeft(prev => (prev === null ? prev : Math.max(prev - 1, 0)));
        }

        try {
            setIsLoading(true);
            if (audio.ended) audio.currentTime = 0;
            await audio.play();
            setIsPlaying(true);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('无法播放，请检查网络后重试');
            setIsPlaying(false);
            setIsLoading(false);
        }
    };

    const handleSeek = (value: number) => {
        if (!allowSeek) return;
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = value;
        setCurrentTime(value);
    };

    const handleReplayFromStart = () => {
        const audio = audioRef.current;
        if (!audio) return;
        const willConsume = audio.currentTime === 0 || audio.ended;
        if (finiteReplays !== null && willConsume && (replaysLeft ?? 0) <= 0) {
            setError('播放次数已用完');
            return;
        }
        if (finiteReplays !== null && willConsume) {
            setReplaysLeft(prev => (prev === null ? prev : Math.max(prev - 1, 0)));
        }
        audio.currentTime = 0;
        audio
            .play()
            .then(() => {
                setIsPlaying(true);
                setError(null);
            })
            .catch(() => {
                setError('无法播放，请检查网络后重试');
            });
    };

    const speeds = [0.75, 1, 1.25, 1.5];
    const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
    const replayText =
        finiteReplays === null ? '无限重播' : `剩余 ${Math.max(replaysLeft ?? finiteReplays, 0)} 次`;

    const showSpeedControls = !isStrictMode;
    const showReplayControl = !isStrictMode;
    const showTranscriptToggle = !isStrictMode && subtitlesAllowed;

    return (
        <div className="bg-white/80 border border-slate-100 rounded-2xl shadow-sm p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-${themeColor}-50 text-${themeColor}-600 border border-${themeColor}-100`}>
                        Listening
                    </span>
                    <span className="text-[12px] font-semibold text-gray-800 truncate">{title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-black/5 font-semibold border border-white/60">
                        {mode === 'exam' ? '考试模式' : '练习模式'}
                    </span>
                    {finiteReplays !== null && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold">
                            {replayText}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handlePlayPause}
                    className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        shadow-md border border-white/40 text-white
                        bg-gradient-to-br from-${themeColor}-500 via-${themeColor}-500 to-${themeColor}-600
                        active:scale-95 transition-transform duration-150
                        ${finiteReplays !== null && (replaysLeft ?? 0) <= 0 && (audioRef.current?.ended || audioRef.current?.currentTime === 0) ? 'opacity-60 pointer-events-none' : ''}
                    `}
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : isPlaying ? (
                        <Pause size={16} />
                    ) : (
                        <Play size={16} className="translate-x-[1px]" />
                    )}
                </button>

                <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="relative h-2">
                        <div className="absolute inset-0 rounded-full bg-white/70 border border-black/5 shadow-inner" />
                        <div
                            className={`absolute inset-y-0 left-0 rounded-full bg-${themeColor}-500/90`}
                            style={{ width: `${progress}%` }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={Math.max(duration, 0.1)}
                            step={0.1}
                            value={Math.min(currentTime, duration || 0)}
                            onChange={(e) => handleSeek(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            disabled={!allowSeek}
                        />
                    </div>
                    {!allowSeek && (
                        <div className="text-[10px] text-gray-400 font-semibold">考试中禁用进度拖动</div>
                    )}
                </div>
            </div>

            {(showSpeedControls || showReplayControl || showTranscriptToggle) && (
                <div className="flex items-center flex-wrap gap-1.5">
                    {showSpeedControls && (
                        <>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                                <Gauge size={12} />
                                倍速
                            </div>

                            <div className="relative" ref={speedMenuRef}>
                                <button
                                    onClick={() => setIsSpeedMenuOpen((o) => !o)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isSpeedMenuOpen}
                                    className={`
                                        px-2 py-1 rounded-full text-[10px] font-bold border transition
                                        bg-white text-gray-700 border-gray-200 hover:border-gray-300
                                        ${isSpeedMenuOpen ? `shadow-sm border-${themeColor}-200` : ''}
                                    `}
                                >
                                    {speed.toFixed(2).replace(/\.00$/, '')}x
                                </button>

                                {isSpeedMenuOpen && (
                                    <div
                                        role="listbox"
                                        className="absolute z-20 mt-1.5 w-28 rounded-lg border border-gray-200 bg-white shadow-lg p-1 space-y-0.5"
                                    >
                                        {speeds.map((s) => (
                                            <button
                                                key={s}
                                                role="option"
                                                aria-selected={s === speed}
                                                onClick={() => {
                                                    setSpeed(s);
                                                    setIsSpeedMenuOpen(false);
                                                }}
                                                className={`
                                                    w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition
                                                    ${s === speed
                                                        ? `bg-${themeColor}-50 text-${themeColor}-700 border border-${themeColor}-100`
                                                        : 'text-gray-700 hover:bg-gray-50'}
                                                `}
                                            >
                                                {s.toFixed(2).replace(/\.00$/, '')}x
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {showReplayControl && (
                        <button
                            onClick={handleReplayFromStart}
                            className="ml-1 px-2 py-1 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 transition"
                        >
                            <div className="flex items-center gap-1">
                                <RotateCcw size={12} />
                                <span>{finiteReplays === null ? '重播' : replayText}</span>
                            </div>
                        </button>
                    )}

                    {showTranscriptToggle && (
                        <button
                            onClick={() => subtitlesAllowed && setShowTranscript((p) => !p)}
                            disabled={!subtitlesAllowed}
                            className={`
                                px-2 py-1 rounded-full text-[10px] font-bold border transition
                                ${showTranscript ? `bg-${themeColor}-50 text-${themeColor}-700 border-${themeColor}-200` : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}
                                ${!subtitlesAllowed ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <div className="flex items-center gap-1">
                                <Captions size={12} />
                                <span>{subtitlesAllowed ? (showTranscript ? '收起原文' : '显示原文') : '字幕已关闭'}</span>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {showTranscript && transcript && (
                <div className="bg-white/80 border border-gray-100 rounded-xl p-2.5 text-[12px] text-gray-800 shadow-inner leading-relaxed">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mb-1">
                        <Sparkles size={12} />
                        <span>听力原文</span>
                    </div>
                    <p className="whitespace-pre-wrap">{transcript}</p>
                </div>
            )}

            {error && (
                <div className="text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                    {error}
                </div>
            )}
        </div>
    );
};
