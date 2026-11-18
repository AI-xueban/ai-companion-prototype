import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AITutorLayer } from '../Dashboard/AITutorLayer';
import { AI_SOLVE_MOCK_SHOTS } from '../../data/aiSolveMockData';
import { TUTOR_GARDEN_EXAMPLE } from '../../data/tutorGardenExample';
import '../../styles/ui-clarity.css';

function TutorBoardReview() {
  const examples = [...AI_SOLVE_MOCK_SHOTS.flatMap(shot => shot.questions), TUTOR_GARDEN_EXAMPLE];
  const [id, setId] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('sample');
    return examples.some(q => q.id === requested) ? requested! : examples[0].id;
  });
  const [open, setOpen] = useState(true);
  return <div style={{ background: '#eef0f5', minHeight: '100vh', padding: 24, fontFamily: 'Nunito, sans-serif' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <strong>灵境解题 · 本地交互验收</strong>
      <select aria-label="演示题目" value={id} onChange={e => { setId(e.target.value); setOpen(true); }}>
        {examples.map(q => <option key={q.id} value={q.id}>{q.id === TUTOR_GARDEN_EXAMPLE.id ? '长题多图 · 花园改造（3小问）' : `${q.subject} · ${q.number} · ${q.text.slice(0, 22)}`}</option>)}
      </select>
      <button onClick={() => setOpen(true)}>重新进入</button>
      <a href="/">返回完整平板</a>
    </div>
    <div style={{ width: 'min(1200px,100%)', aspectRatio: '3 / 2', margin: 'auto', containerType: 'inline-size' }}>
      <div className="ai-v2-clean" style={{ position: 'relative', width: 768, height: 512, transform: 'scale(calc(100cqw / 768px))', transformOrigin: 'top left', overflow: 'hidden' }}>
        {open && <AITutorLayer key={id} question={examples.find(q => q.id === id)} onClose={() => setOpen(false)} />}
      </div>
    </div>
    <p style={{ maxWidth: 1200, margin: '16px auto', fontSize: 14, color: '#6b7280' }}>独立验收入口，复用业务讲题组件与全局 UI 规范。教学内容为固定演示脚本；语音依赖浏览器支持。</p>
  </div>;
}

createRoot(document.getElementById('root')!).render(<TutorBoardReview />);
