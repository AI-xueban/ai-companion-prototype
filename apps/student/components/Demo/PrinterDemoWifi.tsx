import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle, LockKeyhole, Plus, Wifi } from 'lucide-react';
import { classroomWifi, hiddenWifiName, type DemoWifiIssue, type DemoWifiNetwork, type PrinterWifiScheme } from './printerDemoScenarios';

const localWifi: DemoWifiNetwork = { name: 'AI-Classroom-Local', localOnly: true };
const availableNetworks = [classroomWifi, localWifi];
const actionClass = 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const fieldClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm';

interface PrinterDemoWifiProps {
  scheme: PrinterWifiScheme;
  current: DemoWifiNetwork | null;
  enabled: boolean;
  showHiddenHint: boolean;
  issue: DemoWifiIssue | null;
  onIssueShown: () => void;
  onBack: (network: DemoWifiNetwork | null, enabled: boolean) => void;
}

export const PrinterDemoWifi = ({ scheme, current, enabled, showHiddenHint, issue, onIssueShown, onBack }: PrinterDemoWifiProps) => {
  const honor = scheme === 'honor';
  const [wlanEnabled, setWlanEnabled] = useState(enabled);
  const [currentNetwork, setCurrentNetwork] = useState(current);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
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
  const otherNetworks = availableNetworks.filter((network) => network.name !== currentNetwork?.name);
  const listedNetworks = currentNetwork ? [currentNetwork, ...otherNetworks] : otherNetworks;

  const goBack = () => {
    if (form) {
      setConnecting(null);
      setForm(null);
    } else if (showMoreSettings) {
      setShowMoreSettings(false);
    } else {
      onBack(currentNetwork, wlanEnabled);
    }
  };

  const toggleWifi = () => {
    if (wlanEnabled) setCurrentNetwork(null);
    setWlanEnabled(!wlanEnabled);
  };

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
      } else if (honor) {
        setCurrentNetwork(connecting);
        setForm(null);
        setShowMoreSettings(false);
      } else {
        onBack(connecting, wlanEnabled);
      }
    }, 750);
    return () => window.clearTimeout(timer);
  }, [connecting, honor, issue, onBack, onIssueShown, wlanEnabled]);

  return (
    <section role="dialog" aria-labelledby="printer-wifi-title" onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        goBack();
      }
    }} className={`absolute inset-0 z-[610] flex flex-col ${honor ? 'bg-[#eff0f3] text-[#191919]' : 'bg-slate-100 text-slate-900'}`}>
      <header className={`flex items-center gap-3 px-5 py-3 ${honor ? '' : 'border-b border-slate-200 bg-white'}`}>
        <button type="button" autoFocus aria-label={form || showMoreSettings ? '返回网络列表' : '返回连接打印机'} onClick={goBack} className={`grid h-10 w-10 place-items-center rounded-xl ${honor ? 'hover:bg-black/5' : 'bg-slate-100 hover:bg-slate-200'}`}>{honor ? <ChevronLeft size={25} /> : <ArrowLeft size={19} />}</button>
        <h2 id="printer-wifi-title" className={honor ? 'text-2xl font-semibold' : 'text-lg font-semibold'}>{honor ? 'WLAN' : 'Wi-Fi 设置'}</h2>
        <span className="ml-auto text-xs text-slate-500">{honor ? '荣耀系统设置演示' : '模拟设置'}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className={`mx-auto space-y-3 ${honor ? 'max-w-none' : 'max-w-xl'}`}>
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
                <button type="button" onClick={goBack} className="px-3 text-sm text-slate-600">取消</button>
                <button type="submit" disabled={Boolean(connecting) || (manual && !name.trim()) || ((!manual || security !== '无') && !password)} className={actionClass}>{connecting ? '正在连接…' : '连接'}</button>
              </div>
            </form>
          ) : honor ? (
            showMoreSettings ? (
              <div className="rounded-2xl bg-white p-4">
                <h3 className="font-semibold">更多 WLAN 设置</h3>
                <button type="button" onClick={() => openForm('manual')} className="mt-3 py-2 text-sm text-blue-700">添加网络</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="text-base">WLAN</span>
                  <button type="button" role="switch" aria-label="WLAN" aria-checked={wlanEnabled} onClick={toggleWifi} className={`flex h-6 w-11 items-center rounded-full p-0.5 ${wlanEnabled ? 'justify-end bg-blue-600' : 'bg-slate-300'}`}><span className="h-5 w-5 rounded-full bg-white" /></button>
                </div>
                {wlanEnabled && <>
                  <p className="px-4 text-xs text-slate-600">连接 Wi-Fi 后，点击左上角返回应用，继续搜索同一 Wi-Fi 下的打印机。</p>
                  {showHiddenHint && <p className="px-4 text-xs text-slate-600">此演示场景请在“更多 WLAN 设置 → 添加网络”中输入 {hiddenWifiName}，并勾选“隐藏网络”。</p>}
                  <button type="button" onClick={() => setShowMoreSettings(true)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left">更多 WLAN 设置<ChevronRight size={18} className="text-slate-400" /></button>
                  {currentNetwork && <div>
                    <h3 className="px-4 py-2 text-sm text-slate-600">已连接 WLAN</h3>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                      <div><p className="font-medium text-blue-600">{currentNetwork.name}</p><p className="mt-1 text-sm text-slate-500">已连接</p></div>
                      <Wifi size={21} />
                    </div>
                  </div>}
                  <div>
                    <h3 className="px-4 py-2 text-sm text-slate-600">可用 WLAN</h3>
                    <div className="divide-y divide-slate-200 rounded-2xl bg-white px-4">
                      {otherNetworks.map((network) => <button key={network.name} type="button" onClick={() => openForm(network)} className="flex w-full items-center justify-between py-3 text-left">
                        <span>{network.name}<small className="mt-1 block text-slate-500">加密</small></span><Wifi size={21} />
                      </button>)}
                      <button type="button" onClick={() => openForm('manual')} className="w-full py-3 text-left text-blue-700">添加网络</button>
                    </div>
                  </div>
                </>}
              </>
            )
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <span className="text-sm font-semibold">Wi-Fi</span>
                <button type="button" role="switch" aria-label="Wi-Fi" aria-checked={wlanEnabled} onClick={toggleWifi} className={`rounded-full px-3 py-1 text-xs font-semibold ${wlanEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{wlanEnabled ? '已开启' : '已关闭'}</button>
              </div>
              {wlanEnabled && <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between px-4 py-3"><h3 className="text-sm font-semibold">附近网络</h3><button type="button" disabled={refreshing} onClick={() => setRefreshing(true)} className="text-xs font-medium text-blue-700">刷新</button></div>
                {refreshing ? <p role="status" className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500"><LoaderCircle size={14} className="animate-spin" />正在搜索 Wi-Fi…</p> : listedNetworks.map((network) => (
                  <button key={network.name} type="button" onClick={() => currentNetwork?.name === network.name ? goBack() : openForm(network)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50">
                    <Wifi size={16} className="text-blue-600" /><span className="flex-1 text-sm">{network.name}{currentNetwork?.name === network.name && <small className="block text-slate-500">已连接{network.localOnly ? ' · 无互联网' : ''}</small>}</span><LockKeyhole size={13} className="text-slate-400" /><ChevronRight size={14} className="text-slate-400" />
                  </button>
                ))}
                <button type="button" onClick={() => openForm('manual')} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"><Plus size={16} />添加网络</button>
              </div>}
              {wlanEnabled && showHiddenHint && <p className="text-xs text-slate-500">演示提示：手动添加 {hiddenWifiName}，并勾选「隐藏网络」。</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
