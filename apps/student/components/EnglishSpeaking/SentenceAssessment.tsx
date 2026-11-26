import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type AssessmentTurn = {
  answer: string;
  answerZh?: string;
  question: string;
  grammar: number;
  pronunciation: number;
  textOnly?: boolean;
};

function analyzeSentence(sentence: string) {
  const text = sentence.replace(/^[Yy]es,\s*/, '').trim();
  if (/\bwould like to\b/i.test(text)) return { structure: '主语 + would like to + 动词原形', explanation: '用 would like to 表达想做的事，语气礼貌。to 后接动词原形。', focus: 'would like to', suggestion: '将 would like to 连起来读，把重音放在后面的动作上。' };
  if (/\bwould like\b/i.test(text)) return { structure: '主语 + would like + 名词短语', explanation: '用 would like 表达想要的物品，后面直接接物品名称，适合点单场景。', focus: 'would like', suggestion: '先完整说出 would like，再清楚读出物品名称。' };
  if (/\b(?:like|enjoy) (?:playing|reading|drawing|collecting|swimming)\b/i.test(text)) return { structure: '主语 + like / enjoy + 动名词短语', explanation: '用动名词短语表达喜欢的活动。enjoy 后接动词时使用 -ing 形式。', focus: text.match(/\b(?:playing|reading|drawing|collecting|swimming)\b/i)?.[0] ?? 'enjoy', suggestion: '清楚读出动词的 -ing 词尾，避免吞音。' };
  if (/\bwill\b/i.test(text)) return { structure: '主语 + will + 动词原形 + 补充信息', explanation: '用 will 描述将来的计划。will 后接动词原形，后面的信息说明对象或地点。', focus: 'will', suggestion: 'will 可以轻读，强调真正要做的动作。' };
  if (/\bcan\b/i.test(text)) return { structure: '主语 + can + 动词原形 + 补充信息', explanation: '用 can 表达能力或能做的事。can 后的动词保持原形。', focus: 'can', suggestion: '自然表达能力时轻读 can，把主要动作读清楚。' };
  if (/\b(?:played|visited|went|ate)\b/i.test(text)) return { structure: '主语 + 过去式动词 + 补充信息', explanation: '句子描述已经发生的事情，动词使用过去式。时间表达应与过去时一致。', focus: text.match(/\b(?:played|visited|went|ate)\b/i)?.[0] ?? '', suggestion: '注意过去式的词尾，并在时间信息前自然停顿。' };
  if (/\b(?:am|is|are)\b/i.test(text)) return { structure: '主语 + be 动词 + 表语 / 补充信息', explanation: 'be 动词连接主语与身份、状态或位置。若后接动词 -ing，则共同构成进行时。', focus: text.match(/\b(?:am|is|are)\b/i)?.[0] ?? '', suggestion: 'be 动词轻读，突出后面的身份、状态或地点。' };
  return { structure: '主语 + 谓语动词 + 宾语 / 补充信息', explanation: '句子先说明谁做什么，再用后面的内容补充对象、时间、地点或原因。一般现在时可描述习惯和喜好。', focus: text.split(/\s+/).filter(word => word.length > 5)[0]?.replace(/[.,!?]/g, '') ?? '', suggestion: '按意思分组朗读，突出主要动作和关键词，句尾完整收音。' };
}

export function SentenceAssessment({ turn, onClose, renderAudio, audioError, returnFocusTo }: {
  turn: AssessmentTurn;
  onClose: () => void;
  renderAudio: (text: string) => React.ReactNode;
  audioError?: string;
  returnFocusTo?: HTMLElement | null;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const sentences = turn.answer.match(/[^.!?]+[.!?]?/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [turn.answer];

  useEffect(() => {
    const previousFocus = returnFocusTo ?? document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { window.requestAnimationFrame(() => { if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus(); }); };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') onClose();
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') ?? []);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <div className="es-overlay" onClick={onClose}>
    <div className="es-dialog es-sentence-assessment" role="dialog" aria-modal="true" aria-labelledby="es-sentence-title" ref={dialog} onClick={event => event.stopPropagation()} onKeyDown={handleKeyDown}>
      <header className="es-sentence-header"><div><h2 id="es-sentence-title">这句话说得怎么样</h2><small>AI 逐句测评 · 示例结果</small></div><button type="button" aria-label="关闭逐句测评" onClick={onClose}><X size={20} /></button></header>
      <div className="es-sentence-body" tabIndex={0}>
        <section className="es-assessed-original"><div className="es-spoken-line">{renderAudio(turn.answer)}<strong lang="en">{turn.answer}</strong></div>{turn.answerZh && <p>{turn.answerZh}</p>}</section>
        {audioError && <p className="es-audio-error" role="status">{audioError}</p>}
        <div className="es-sentence-scores">
          <div><span>发音准确度</span><strong>{turn.textOnly ? '—' : turn.pronunciation}<small>{!turn.textOnly && '/100'}</small></strong></div>
          <div><span>流利度</span><strong>{turn.textOnly ? '—' : Math.min(100, turn.pronunciation + 2)}<small>{!turn.textOnly && '/100'}</small></strong></div>
          <div><span>语法</span><strong>{turn.grammar}<small>/10</small></strong></div>
        </div>
        <section><h3>发音准确度</h3><p>{turn.textOnly ? '这条消息直接发送了译文，没有录音，暂不评估发音。' : '示例反馈：主要词语读音清楚。练习时留意长词和词尾的完整发音。'}</p>{!turn.textOnly && <ul>{sentences.map((sentence, index) => {
          const analysis = analyzeSentence(sentence);
          return <li key={index}>{analysis.focus && <b lang="en">{analysis.focus} · </b>}{analysis.suggestion}</li>;
        })}</ul>}</section>
        <section><h3>流利度</h3><p>{turn.textOnly ? '需要一段完整录音，才能分析停顿、语速和连贯性。' : '示例反馈：整体表达连贯。按意义分组，在分句间短暂停顿，避免逐词停顿。可回听原句后，再以自然语速练习。'}</p></section>
        <section><h3>语法</h3><p>当前句子示例语法得分为 {turn.grammar}/10。{turn.grammar >= 8 ? '表达完整，主要句式清楚。' : '可以重点检查动词形式和词语搭配。'}</p><p>原问题：<span lang="en">{turn.question}</span></p></section>
        <section><h3>句子分析</h3>{sentences.map((sentence, index) => {
          const analysis = analyzeSentence(sentence);
          return <div className="es-clause-analysis" key={index}><strong lang="en">{sentence}</strong><p>{analysis.structure}</p><p>{analysis.explanation}</p></div>;
        })}</section>
        <small className="es-assessment-disclaimer">当前为原型示例测评。真实结果需结合本句录音与 AI 分析生成。</small>
      </div>
    </div>
  </div>;
}
