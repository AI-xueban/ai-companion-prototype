import React, { useMemo } from 'react';

const sanitizeXkwHtml = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');

interface XkwHtmlExplanationProps {
  html: string;
  className?: string;
}

export const XkwHtmlExplanation: React.FC<XkwHtmlExplanationProps> = ({ html, className = '' }) => {
  const safeHtml = useMemo(() => sanitizeXkwHtml(html), [html]);

  return (
    <>
      <style>{`
        .xkw-html-explanation .xkw-math-img { height: 1.25em; vertical-align: middle; display: inline-block; }
        .xkw-html-explanation p { margin: 0.4em 0; }
        .xkw-html-explanation .qml-seg { margin-bottom: 0.75rem; }
      `}</style>
      <div
        className={`xkw-html-explanation text-sm text-slate-700 leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </>
  );
};
