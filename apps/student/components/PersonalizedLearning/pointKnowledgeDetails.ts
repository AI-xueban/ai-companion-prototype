export type PointKnowledgeDetails = { desc: string; counts: number[] };

export function getPointDifficulty(details?: PointKnowledgeDetails) {
  const counts = Array.from({ length: 5 }, (_, index) => {
    const count = Number(details?.counts[index]);
    return Number.isFinite(count) && count > 0 ? count : 0;
  });
  const total = counts.reduce((sum, count) => sum + count, 0);
  const largestCount = Math.max(...counts);
  // Use the most represented difficulty; ties go to the harder level.
  const stars = total ? counts.lastIndexOf(largestCount) + 1 : null;
  return { counts, total, stars };
}

/** Source descriptions contain formulas/tables; retain formatting, never scripts or handlers. */
export function sanitizePointDescription(source: string) {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const allowed = new Set(['P', 'BR', 'DIV', 'SPAN', 'B', 'STRONG', 'EM', 'I', 'U', 'SUB', 'SUP', 'BDO', 'UL', 'OL', 'LI', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH', 'IMG']);
  doc.querySelectorAll('script,style,iframe,object,embed,svg,math,form,input').forEach(node => node.remove());
  for (const node of [...doc.body.querySelectorAll('*')]) {
    if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); continue; }
    const src = node.getAttribute('src');
    const alt = node.getAttribute('alt');
    const colspan = node.getAttribute('colspan');
    const rowspan = node.getAttribute('rowspan');
    const isFormula = node.classList.contains('MathJye');
    const formatting = ['border-bottom', 'border-top', 'text-align', 'vertical-align', 'white-space', 'font-style']
      .map(key => [key, (node as HTMLElement).style.getPropertyValue(key)]);
    for (const attr of [...node.attributes]) node.removeAttribute(attr.name);
    if (isFormula) node.classList.add('bkl-math-formula');
    for (const [key, value] of formatting) if (value) (node as HTMLElement).style.setProperty(key, value);
    if (node.tagName === 'IMG') {
      if (src && /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z\d+/=\s]+$/i.test(src) && src.length < 5_000_000) {
        node.setAttribute('src', src);
        node.setAttribute('alt', alt || '知识点公式或示意图');
        continue;
      }
      try {
        const url = new URL(src ?? '', 'https://www.jyeoo.com');
        if (!['img.jyeoo.net', 'www.jyeoo.com'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) { node.remove(); continue; }
        url.protocol = 'https:';
        node.setAttribute('src', url.href);
        node.setAttribute('alt', alt || '知识点公式或示意图');
        node.setAttribute('referrerpolicy', 'no-referrer');
      } catch { node.remove(); }
    }
    for (const [key, value] of [['colspan', colspan], ['rowspan', rowspan]]) {
      if (['TD', 'TH'].includes(node.tagName) && value && /^\d{1,2}$/.test(value)) node.setAttribute(key!, value);
    }
  }
  return doc.body.textContent?.trim() || doc.body.querySelector('img') ? doc.body.innerHTML : '';
}
