import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  getNextDiscoveryCoverSrc,
  normalizeDiscoveryImageUrl,
  toLandscapeCoverUrl,
  toPortraitCoverUrl,
  type DiscoveryImageRef,
} from '../../data/discoveryCoverImages';

type Props = {
  article: DiscoveryImageRef & { coverImage: string };
  className?: string;
  portrait?: boolean;
};

const useCoverSrcWithRetry = (
  article: DiscoveryImageRef,
  primarySrc: string,
  portrait: boolean
) => {
  const [src, setSrc] = useState(primarySrc);
  const [retryCount, setRetryCount] = useState(0);
  const failedUrlsRef = useRef<Set<string>>(new Set());
  const srcRef = useRef(primarySrc);

  useEffect(() => {
    setSrc(primarySrc);
    srcRef.current = primarySrc;
    setRetryCount(0);
    failedUrlsRef.current = new Set();
  }, [primarySrc, article.id]);

  useEffect(() => {
    srcRef.current = src;
  }, [src]);

  const handleError = useCallback(() => {
    failedUrlsRef.current.add(normalizeDiscoveryImageUrl(srcRef.current));
    setRetryCount((prev) => {
      const stage = prev + 1;
      const aspect = portrait ? 'portrait' : 'landscape';
      const next = getNextDiscoveryCoverSrc(article, aspect, failedUrlsRef.current, stage);
      if (next) setSrc(next);
      return stage;
    });
  }, [article, portrait]);

  return { src, handleError, retryCount };
};

export const DiscoveryCoverImage: React.FC<Props> = ({
  article,
  className,
  portrait = !!article.shortVideo?.isShort,
}) => {
  const primarySrc = portrait
    ? toPortraitCoverUrl(article.coverImage)
    : toLandscapeCoverUrl(article.coverImage);

  const { src, handleError, retryCount } = useCoverSrcWithRetry(article, primarySrc, portrait);

  return (
    <img
      src={src}
      alt={article.title}
      loading="lazy"
      onError={retryCount < 8 ? handleError : undefined}
      className={className}
    />
  );
};

type BlockProps = {
  article: DiscoveryImageRef;
  src: string;
  alt?: string;
  className?: string;
};

/** 正文插图：失败时按标题重新生成 */
export const DiscoveryBlockImage: React.FC<BlockProps> = ({
  article,
  src: blockSrc,
  alt = '',
  className,
}) => {
  const primarySrc = toLandscapeCoverUrl(blockSrc);
  const { src, handleError, retryCount } = useCoverSrcWithRetry(article, primarySrc, false);

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={retryCount < 8 ? handleError : undefined}
      className={className}
    />
  );
};
