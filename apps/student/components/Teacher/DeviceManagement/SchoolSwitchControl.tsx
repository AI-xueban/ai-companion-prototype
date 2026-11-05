import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DeviceControlLayer } from './DeviceControlLayer';
import './SchoolBorrowingControl.css';

type Grade = { grade?: number; label: string; ids: string[] };
export const SchoolSwitchControl: React.FC<{
  module: 'world' | 'lock'; rows: Grade[]; restricted: (id: string) => boolean;
  onApply: (ids: string[], label: string, restore: boolean) => void;
}> = ({ module, rows, restricted, onApply }) => {
  const [restore, setRestore] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const world = module === 'world';
  const selectable = rows.filter(row => row.ids.length);
  const blocked = selectable.filter(row => row.ids.some(restricted));
  const allBlocked = selectable.length > 0 && selectable.every(row => row.ids.every(restricted));
  const available = selectable.filter(row => restore ? row.ids.some(restricted) : row.ids.some(id => !restricted(id)));
  const chosen = available.filter(row => selected.includes(row.grade!));
  const names = (items: Grade[]) => items.map(row => ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][row.grade ?? 0] || row.label.replace('年级', '')).join('、') + '年级';
  const open = (value: boolean) => { setRestore(value); setSelected(selectable.filter(row => value ? row.ids.some(restricted) : row.ids.some(id => !restricted(id))).map(row => row.grade!)); };
  const action = (value: boolean) => world ? value ? '恢复使用' : '停止使用' : value ? '解除临时锁屏' : '临时锁屏';
  return <>
    <div className="borrow-order-description borrow-order-strip">{world ? '可按全校或年级停止、恢复使用万象视界；保存时可选择是否保留老师的设置。' : '可按全校或年级临时锁屏；解除后执行当前日常锁屏设置。临时锁屏期间，相关班级老师不能调整锁屏。'}</div>
    <section className="borrow-policy-section borrow-policy-section--primary" aria-label={world ? '全校万象视界管控' : '全校锁屏管控'}>
      <header className="borrow-policy-heading"><div className="borrow-policy-title"><h2>{world ? '全校万象视界管控' : '全校锁屏管控'}</h2></div><button type="button" className="dc-btn-primary" disabled={!selectable.length} onClick={() => open(allBlocked)}>{world ? allBlocked ? '全校恢复使用' : '全校停止使用' : allBlocked ? '全校解除临时锁屏' : '全校临时锁屏'}</button></header>
      {!!blocked.length && <div className="borrow-policy-list"><article className="borrow-policy-row"><div className="borrow-policy-content"><h3>{names(blocked)}</h3><p>{world ? '已停止使用' : '已临时锁屏'}{blocked.some(row => !row.ids.every(restricted)) ? '（含部分学生）' : ''}</p></div><button type="button" className="dc-btn borrow-restore-button" onClick={() => open(true)}>{action(true)}</button></article></div>}
      {!rows.length && <p className="borrow-policy-empty mx-6">学校暂无可设置的年级</p>}
    </section>
    {restore !== null && <DeviceControlLayer labelId="school-switch-title" onClose={() => setRestore(null)}>{close => <>
      <header className="borrow-policy-heading border-b"><h2 className="text-xl font-bold" id="school-switch-title">{world ? '万象视界' : ''}{action(restore)}</h2><button type="button" aria-label="关闭年级选择" onClick={close}><X size={20} /></button></header>
      <div className="dc-panel-body"><fieldset><legend className="mb-3 text-sm font-semibold"><span className="mr-1 text-red-500" aria-hidden="true">*</span>设置范围</legend><label className="borrow-school-choice"><input type="checkbox" disabled={!available.length} checked={available.length > 0 && available.every(row => selected.includes(row.grade!))} onChange={event => setSelected(event.target.checked ? available.map(row => row.grade!) : [])} />全校</label><div className="borrow-temporary-grades">{rows.map(row => <label key={row.grade} className={!available.includes(row) ? 'borrow-grade-disabled' : undefined}><input type="checkbox" disabled={!available.includes(row)} checked={available.includes(row) && selected.includes(row.grade!)} onChange={event => setSelected(current => event.target.checked ? [...current, row.grade!] : current.filter(grade => grade !== row.grade))} />{row.label}</label>)}</div></fieldset></div>
      <footer className="dc-confirm-footer"><button type="button" className="dc-btn" onClick={close}>取消</button><button type="button" className="dc-btn-primary" disabled={!chosen.length} onClick={() => { const ids = chosen.flatMap(row => row.ids); const label = ids.length === selectable.flatMap(row => row.ids).length ? '全校' : names(chosen); onApply(ids, label, restore); setRestore(null); }}>{world ? '下一步' : '确认'}</button></footer>
    </>}</DeviceControlLayer>}
  </>;
};
