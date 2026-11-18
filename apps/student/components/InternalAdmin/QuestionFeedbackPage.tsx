import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, RefreshCw, X } from 'lucide-react';
import { listQuestionFeedbackReports } from '../../services/questionFeedbackService';
import type { QuestionFeedbackReport } from '../../types/questionFeedback';

const sceneLabels: Record<string, string> = {
  practice: '精准练习 · 答题中',
  review: '精准练习 · 结果回看',
  mistake: '错题订正',
  stepping: '逐题练习',
  paper: '纸面作答',
  manual_grade: '手动批改',
};

const reportLabels = (report: QuestionFeedbackReport) =>
  report.reasonLabels?.length ? report.reasonLabels : report.reasonLabel.split('、').filter(Boolean);

const reportReasons = (report: QuestionFeedbackReport) =>
  report.reasons?.length ? report.reasons : [report.reason];

const jsonText = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

const csvCell = (value: unknown) => {
  let text = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);
  if (/^[\t\r ]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
};

const QuestionFeedbackDetail: React.FC<{
  report: QuestionFeedbackReport;
  onClose: () => void;
}> = ({ report, onClose }) => {
  const question = report.questionSnapshot;
  const request = report.practiceRequest ?? {};
  const requestEntries = Object.entries(request);
  const details: [string, React.ReactNode][] = [
    ['反馈编号', report.id],
    ['提交时间', formatTime(report.createdAt)],
    ['反馈类型', reportLabels(report).join('、')],
    ['原因编码', reportReasons(report).join('、')],
    ['反馈场景', sceneLabels[report.scene] ?? report.scene],
    ['题目 ID', report.questionId],
    ['题库原题 ID', report.externalQuestionId || '—'],
    ['题库来源', report.source || '—'],
    ['学科 / 题型', `${report.subject} / ${report.questionType}`],
    ['知识点', report.knowledgePoints?.join('、') || '—'],
  ];

  return (
    <div className="absolute inset-0 z-[100] flex justify-end bg-slate-900/35" onClick={onClose}>
      <section className="flex h-full w-full max-w-[900px] flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-100 px-5">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900">题目反馈详情</h3>
            <p className="truncate text-[11px] text-gray-400">{report.questionId} · {formatTime(report.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭详情" className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-[13px]">
          <section className="rounded-xl border border-gray-100 p-4">
            <h4 className="mb-3 font-semibold text-gray-900">反馈信息</h4>
            <dl className="grid gap-3 sm:grid-cols-2">
              {details.map(([label, value]) => <div key={label}><dt className="text-xs text-gray-400">{label}</dt><dd className="mt-1 break-words text-gray-800">{value}</dd></div>)}
            </dl>
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400">文字说明</p>
              <p className="mt-1 min-h-6 whitespace-pre-wrap break-words text-gray-800">{report.description || '未填写'}</p>
            </div>
            {report.handwriting ? (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="mb-2 text-xs text-gray-400">手写原图</p>
                <img src={report.handwriting} alt="学生手写反馈原图" className="max-h-72 max-w-full rounded-lg border border-gray-100 object-contain" />
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-gray-100 p-4">
            <h4 className="mb-3 font-semibold text-gray-900">题目详情</h4>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="text-xs text-gray-400">题干</dt><dd className="mt-1 whitespace-pre-wrap break-words text-gray-800">{question?.stem || report.stemSnapshot}</dd></div>
              <div><dt className="text-xs text-gray-400">难度</dt><dd className="mt-1 text-gray-800">{question?.difficulty ?? '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">选项</dt><dd className="mt-1 whitespace-pre-wrap text-gray-800">{question?.options?.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n') || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">小题</dt><dd className="mt-1 whitespace-pre-wrap text-gray-800">{question?.subQuestions?.length ? JSON.stringify(question.subQuestions, null, 2) : '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">学生作答</dt><dd className="mt-1 whitespace-pre-wrap text-gray-800">{report.userAnswer || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">参考答案</dt><dd className="mt-1 whitespace-pre-wrap text-gray-800">{report.systemCorrectAnswer || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">批改结果</dt><dd className="mt-1 text-gray-800">{report.systemJudgment || '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-gray-400">解析</dt><dd className="mt-1 whitespace-pre-wrap break-words text-gray-800">{question?.explanation || '—'}</dd></div>
            </dl>
            {question?.images?.length ? <div className="mt-3 flex flex-wrap gap-2">{question.images.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`题目配图${index + 1}`} className="max-h-48 max-w-full rounded border border-gray-100 object-contain" />)}</div> : null}
          </section>

          <section className="rounded-xl border border-gray-100 p-4">
            <h4 className="mb-3 font-semibold text-gray-900">当次取题调用参数</h4>
            {requestEntries.length ? (
              <>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {requestEntries.map(([key, value]) => <div key={key}><dt className="text-xs text-gray-400">{key}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</dd></div>)}
                </dl>
                <details className="mt-4 rounded-lg bg-slate-50 p-3">
                  <summary className="cursor-pointer font-medium text-blue-600">查看完整原始请求 JSON</summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-gray-700">{jsonText(request)}</pre>
                </details>
              </>
            ) : <p className="text-gray-400">该题未记录取题请求参数。</p>}
          </section>
        </div>
      </section>
    </div>
  );
};

export const QuestionFeedbackPage: React.FC = () => {
  const [reports, setReports] = useState<QuestionFeedbackReport[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('全部');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<QuestionFeedbackReport | null>(null);

  const refresh = () => setReports(listQuestionFeedbackReports());
  useEffect(() => { refresh(); }, []);

  const typeOptions = useMemo(() => ['全部', ...new Set(reports.flatMap(reportLabels))], [reports]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports
      .filter((report) => {
        const day = report.createdAt.slice(0, 10);
        const matchesQuery = !query || [report.questionId, report.externalQuestionId, report.stemSnapshot, report.description]
          .some((value) => String(value ?? '').toLowerCase().includes(query));
        return matchesQuery && (type === '全部' || reportLabels(report).includes(type)) && (!from || day >= from) && (!to || day <= to);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reports, search, type, from, to]);

  const exportCsv = () => {
    const headers = ['反馈编号', '提交时间', '反馈类型', '原因编码', '文字说明', '反馈场景', '题目 ID', '题库原题 ID', '来源', '学科', '题型', '知识点', '题干', '题目详情 JSON', '完整取题参数 JSON', '学生作答', '参考答案', '批改结果', '手写原图'];
    const rows = filtered.map((report) => [
      report.id, report.createdAt, reportLabels(report).join('、'), reportReasons(report).join('、'), report.description,
      sceneLabels[report.scene] ?? report.scene, report.questionId, report.externalQuestionId, report.source,
      report.subject, report.questionType, report.knowledgePoints, report.stemSnapshot, report.questionSnapshot,
      report.practiceRequest, report.userAnswer, report.systemCorrectAnswer, report.systemJudgment,
      report.handwriting ? '原图数据见完整 JSON 导出' : '',
    ]);
    const content = '\ufeff' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    download(`题目反馈-${new Date().toISOString().slice(0, 10)}.csv`, content, 'text/csv;charset=utf-8');
  };

  const exportJson = () => download(
    `题目反馈完整数据-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ exportedAt: new Date().toISOString(), count: filtered.length, filters: { search, type, from, to }, reports: filtered }, null, 2),
    'application/json;charset=utf-8',
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[12px] text-gray-500">查询学生提交的题目问题，并核对题目快照和当次取题参数。</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} className="inline-flex h-8 items-center gap-1.5 rounded border border-gray-200 px-3 text-[12px] text-gray-600 hover:bg-gray-50"><RefreshCw size={13} />刷新</button>
          <button type="button" onClick={exportCsv} disabled={!filtered.length} className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-3 text-[12px] font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"><Download size={13} />导出 CSV</button>
          <button type="button" onClick={exportJson} disabled={!filtered.length} className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 px-3 text-[12px] font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"><Download size={13} />导出完整 JSON</button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-[11px] text-gray-500">题目搜索<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="题目 ID、原题 ID 或题干" className="h-8 w-full rounded border border-gray-200 bg-white px-2 text-[12px] text-gray-800 outline-none focus:border-blue-400" /></label>
        <label className="space-y-1 text-[11px] text-gray-500">反馈类型<select value={type} onChange={(event) => setType(event.target.value)} className="h-8 w-full rounded border border-gray-200 bg-white px-2 text-[12px] text-gray-800 outline-none focus:border-blue-400">{typeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="space-y-1 text-[11px] text-gray-500">开始日期<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-8 w-full rounded border border-gray-200 bg-white px-2 text-[12px] text-gray-800" /></label>
        <label className="space-y-1 text-[11px] text-gray-500">结束日期<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-8 w-full rounded border border-gray-200 bg-white px-2 text-[12px] text-gray-800" /></label>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">反馈记录 <span className="ml-1 font-normal text-gray-400">共 {filtered.length} 条</span></h3>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[850px] border-collapse text-left text-[12px]">
          <thead className="bg-gray-50 text-gray-500"><tr>{['提交时间', '反馈类型', '关联题目', '学科', '来源场景', '操作'].map((item) => <th key={item} className="px-3 py-2.5 font-medium">{item}</th>)}</tr></thead>
          <tbody>
            {filtered.length ? filtered.map((report) => (
              <tr key={report.id} className="border-t border-gray-100 hover:bg-blue-50/30">
                <td className="whitespace-nowrap px-3 py-3 text-gray-500">{formatTime(report.createdAt)}</td>
                <td className="max-w-[230px] px-3 py-3"><div className="flex flex-wrap gap-1">{reportLabels(report).map((label) => <span key={label} className="rounded bg-blue-50 px-1.5 py-1 text-[11px] text-blue-700">{label}</span>)}</div></td>
                <td className="max-w-[320px] px-3 py-3"><p className="truncate font-medium text-gray-800">{report.stemSnapshot || report.questionId}</p><p className="mt-0.5 text-[11px] text-gray-400">{report.questionId}</p></td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600">{report.subject}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600">{sceneLabels[report.scene] ?? report.scene}</td>
                <td className="px-3 py-3"><button type="button" onClick={() => setSelected(report)} className="inline-flex items-center gap-1 text-blue-600 hover:underline"><Eye size={13} />查看详情</button></td>
              </tr>
            )) : <tr><td colSpan={6} className="px-3 py-12 text-center text-gray-400">暂无符合条件的反馈记录。</td></tr>}
          </tbody>
        </table>
      </div>

      {selected ? <QuestionFeedbackDetail report={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
};
