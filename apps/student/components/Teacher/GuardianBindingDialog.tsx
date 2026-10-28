import React from 'react';
import { X } from 'lucide-react';
import { GuardianBinding } from './data/guardianBindingDemoData';

export const GuardianBindingDialog: React.FC<{
  student: { name: string; account: string; className: string };
  schoolName: string;
  guardians: GuardianBinding[];
  onClose: () => void;
  onViewQr: () => void;
}> = ({ student, schoolName, guardians, onClose, onViewQr }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label="家长绑定信息" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold">家长绑定信息</h2>
        <button type="button" aria-label="关闭家长绑定信息" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={20}/></button>
      </header>
      <div className="min-h-0 overflow-y-auto px-6 py-5">
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-800">{student.name}<span className="ml-3 font-normal text-slate-500">学号 {student.account}</span></p>
          <p className="mt-2 text-slate-500">{schoolName} · {student.className}</p>
        </div>
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium">已绑定 <span className="text-blue-600">{guardians.length}/6</span> 位家长</p>
          <span className="text-xs text-slate-400">仅展示当前有效绑定</span>
        </div>
        {guardians.length ? <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[590px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{['家长姓名', '与学生关系', '手机号', '主管理身份', '绑定时间'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody>{guardians.map((guardian) => <tr key={guardian.id} className="border-t border-slate-100">
              <td className="px-4 py-4 font-medium">{guardian.name}</td>
              <td className="px-4 py-4">{guardian.relationship}</td>
              <td className="whitespace-nowrap px-4 py-4">{guardian.maskedPhone}</td>
              <td className="whitespace-nowrap px-4 py-4"><span className={guardian.isPrimary ? 'rounded bg-blue-50 px-2 py-1 text-xs text-blue-700' : 'text-slate-500'}>{guardian.isPrimary ? '主管理家长' : '普通家长'}</span></td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-500">{guardian.boundAt}</td>
            </tr>)}</tbody>
          </table>
        </div> : <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
          <p className="text-sm text-slate-600">该学生暂无家长绑定</p>
          <p className="mt-2 text-xs text-slate-400">可将该学生的家长绑定码私下发给对应家庭。</p>
          <button type="button" onClick={onViewQr} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">查看家长绑定码</button>
        </div>}
        <p className="mt-4 text-xs leading-5 text-slate-400">当前为演示数据，手机号已脱敏；正式数据需接入家长绑定服务。</p>
      </div>
    </section>
  </div>
);
