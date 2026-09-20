import React, { useMemo } from 'react';

const sanitizeXkwHtml = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');

const XKW_STEM_STYLES = `
.xkw-html-stem table { border-collapse: collapse; width: 100%; max-width: 520px; margin: 8px 0; font-size: 13px; }
.xkw-html-stem td { border: 1px solid #334155; padding: 6px 8px; vertical-align: middle; }
.xkw-html-stem p { margin: 0.35em 0; }
.xkw-html-stem .qml-bk {
  display: inline-block; min-width: 3.5em; padding: 0 6px; margin: 0 2px;
  border-bottom: 2px solid #818cf8; background: #eef2ff; color: transparent; user-select: none;
}
.xkw-html-stem .xkw-math-img { height: 1.35em; vertical-align: middle; display: inline-block; }
.xkw-html-explanation .xkw-math-img { height: 1.25em; vertical-align: middle; display: inline-block; }
.xkw-html-explanation p { margin: 0.4em 0; }
.xkw-html-explanation .qml-seg { margin-bottom: 0.75rem; }
`;

interface XkwHtmlStemProps {
  html: string;
  className?: string;
}

/** 学科网 HTML 题干（含表格、填空下划线） */
export const XkwHtmlStem: React.FC<XkwHtmlStemProps> = ({ html, className = '' }) => {
  const safeHtml = useMemo(() => sanitizeXkwHtml(html), [html]);

  return (
    <>
      <style>{XKW_STEM_STYLES}</style>
      <div
        className={`xkw-html-stem text-[13px] leading-6 text-slate-800 ${className}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </>
  );
};
