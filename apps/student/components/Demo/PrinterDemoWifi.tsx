import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, LoaderCircle, LockKeyhole, Plus, Wifi } from 'lucide-react';
import { classroomWifi, hiddenWifiName, printerHotspot, type DemoWifiIssue, type DemoWifiNetwork } from './printerDemoScenarios';

const localWifi: DemoWifiNetwork = { name: 'AI-Classroom-Local', localOnly: true };
const availableNetworks = [classroomWifi, localWifi, printerHotspot];
const actionClass = 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const fieldClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm';

interface PrinterDemoWifiProps {
  current: DemoWifiNetwork | null;
  enabled: boolean;
  hotspot: boolean;
  showHiddenHint: boolean;
  issue: DemoWifiIssue | null;
  onToggle: () => void;
  onIssueShown: () => void;
  onConnected: (network: DemoWifiNetwork) => void;
  onBack: () => void;
}

export const PrinterDemoWifi = ({ current, enabled, hotspot, showHiddenHint, issue, onToggle, onIssueShown, onConnected, onBack }: PrinterDemoWifiProps) => {
  const [form, setForm] = useState<DemoWifiNetwork | 'manual' | null>(null);
  const [name, setName] = useState('');
  const [security, setSecurity] = useState('WPA2/WPA3');
  const [hidden, setHidden] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState<DemoWifiNetwork | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const manual = form === 'manual';
  const networks = hotspot ? [printerHotspot, classroomWifi, localWifi] : availableNetworks;
  const listedNetworks = current ? [current, ...networks.filter((network) => network.name !== current.name)] : networks;

  const openForm = (value: NonNullable<typeof form>) => {
    setForm(value);
    setName('');
    setSecurity('WPA2/WPA3');
    setHidden(false);
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  useEffect(() => {
    if (!refreshing) return;
    const timer = window.setTimeout(() => setRefreshing(false), 550);
    return () => window.clearTimeout(timer);
  }, [refreshing]);

  useEffect(() => {
    if (!connecting) return;
    const timer = window.setTimeout(() => {
      setConnecting(null);
      if (issue) {
        setError(issue === 'wrong-password' ? '密码不正确，请重新输入。' : '连接超时，请确认网络可用后重试。');
        onIssueShown();
      } else {
        onConnected(connecting);
      }
    }, 750);
    return () => window.clearTimeout(timer);
  }, [connecting, issue, onConnected, onIssueShown]);

  return (
    <section role="dialog" aria-labelledby="printer-wifi-title" className="absolute inset-0 z-[600] flex flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
        <button type="button" aria-label={form ? '返回网络列表' : '返回连接打印机'} onClick={() => { if (form) { setConnecting(null); setForm(null); } else onBack(); }} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 hover:bg-slate-200"><ArrowLeft size={19} /></button>
        <h2 id="printer-wifi-title" className="text-lg font-semibold">Wi-Fi 设置</h2>
        <span className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">模拟设置</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-xl space-y-3">
          {hotspot && <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">在打印机面板开启 Wi-Fi Direct，核对热点名称和密码。连接打印机热点后，即使没有互联网也可打印本地 PDF。</p>}
          {form ? (
            <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" onSubmit={(event) => {
              event.preventDefault();
              setError('');
              const ssid = name.trim();
              if (manual && ssid === hiddenWifiName && !hidden) {
                setError('找不到该网络，请开启「隐藏网络」后重试。');
                return;
              }
              setConnecting(manual ? availableNetworks.find((item) => item.name === ssid) ?? { name: ssid } : form);
            }}>
              <h3 className="font-semibold">{manual ? '添加网络' : form.name}</h3>
              <fieldset disabled={Boolean(connecting)} className="space-y-3">
                {manual && <>
                  <label className="block text-xs font-medium">Wi-Fi 名称（SSID）<input required maxLength={32} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label>
                  <label className="block text-xs font-medium">安全类型<select value={security} onChange={(event) => setSecurity(event.target.value)} className={fieldClass}><option>WPA2/WPA3</option><option>无</option></select></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} />隐藏网络</label>
                </>}
                {(!manual || security !== '无') && <>
                  <label className="block text-xs font-medium">Wi-Fi 密码<input required type={showPassword ? 'text' : 'password'} autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入示例密码" className={fieldClass} /></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />显示密码</label>
                </>}
              </fieldset>
              {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setConnecting(null); setForm(null); }} className="px-3 text-sm text-slate-600">取消</button>
                <button type="submit" disabled={Boolean(connecting) || (manual && !name.trim()) || ((!manual || security !== '无') && !password)} className={actionClass}>{connecting ? '正在连接…' : '连接'}</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <span className="text-sm font-semibold">Wi-Fi</span>
                <button type="button" role="switch" aria-label="Wi-Fi" aria-checked={enabled} onClick={onToggle} className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{enabled ? '已开启' : '已关闭'}</button>
              </div>
              {enabled && <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between px-4 py-3"><h3 className="text-sm font-semibold">附近网络</h3><button type="button" disabled={refreshing} onClick={() => setRefreshing(true)} className="text-xs font-medium text-blue-700">刷新</button></div>
                {refreshing ? <p role="status" className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500"><LoaderCircle size={14} className="animate-spin" />正在搜索 Wi-Fi…</p> : listedNetworks.map((network) => (
                  <button key={network.name} type="button" onClick={() => current?.name === network.name ? onBack() : openForm(network)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50">
                    <Wifi size={16} className="text-blue-600" /><span className="flex-1 text-sm">{network.name}{(current?.name === network.name || network.hotspot) && <small className="block text-slate-500">{current?.name === network.name ? '已连接' : '打印机热点'}{network.localOnly ? ' · 无互联网' : ''}</small>}</span><LockKeyhole size={13} className="text-slate-400" /><ChevronRight size={14} className="text-slate-400" />
                  </button>
                ))}
                <button type="button" onClick={() => openForm('manual')} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"><Plus size={16} />添加网络</button>
              </div>}
              {enabled && showHiddenHint && <p className="text-xs text-slate-500">演示提示：手动添加 {hiddenWifiName}，并勾选「隐藏网络」。</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
