import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import type { PrintedFileRecord } from '../../services/printedFileService';
import { MyPrintedFilesPage } from '../Growth/MyPrintedFilesPage';
import { buildPaperQuestions, createCombinedPaperDocument } from '../LumiSpace/lumiPaperPdf';
import { PrinterConnectionDemo } from '../SubjectMap/PaperPrintFlow';
import { PrinterDemoWifi } from './PrinterDemoWifi';
import { classroomWifi, demoPrintIssues, type DemoPrinterIssue, type DemoPrintInterruption, type DemoWifiIssue, type DemoWifiNetwork, type PrinterDemoScenarioId } from './printerDemoScenarios';

const scope = '一元一次方程';
const title = '一元一次方程练习（演示）.pdf';
const questionCount = 3;

const loadDemoPdf = () => createCombinedPaperDocument({
  title: '一元一次方程练习',
  scope,
  duration: '10 分钟',
  difficulty: '基础',
  version: 1,
  contentMode: 'paper_only',
  questions: buildPaperQuestions(scope, questionCount),
});

type DemoScreen = 'connection' | 'search' | 'wifi' | 'hotspot' | 'sending' | 'interrupted' | null;

export const PrinterConnectionScenario = ({ scenario, onClose }: { scenario: PrinterDemoScenarioId; onClose: () => void }) => {
  const [screen, setScreen] = useState<DemoScreen>(null);
  const [wifiEnabled, setWifiEnabled] = useState(scenario !== 'no-wifi');
  const [network, setNetwork] = useState<DemoWifiNetwork | null>(() => {
    if (scenario === 'no-wifi' || scenario === 'hidden-wifi' || scenario === 'hotspot' || scenario === 'wrong-password' || scenario === 'wifi-timeout') return null;
    return classroomWifi;
  });
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(null);
  const [wifiIssue, setWifiIssue] = useState<DemoWifiIssue | null>(scenario === 'wrong-password' || scenario === 'wifi-timeout' ? scenario : null);
  const [printerIssue, setPrinterIssue] = useState<DemoPrinterIssue | null>(scenario === 'no-printers' || scenario === 'printer-failed' || scenario === 'printer-offline' ? scenario : null);
  const [interruption, setInterruption] = useState<DemoPrintInterruption | null>(scenario === 'before-send' || scenario === 'after-send' ? scenario : null);
  const [file] = useState<PrintedFileRecord>(() => {
    const now = new Date().toISOString();
    return {
      id: 'printer-connection-demo',
      title,
      subject: '数学',
      questionCount,
      pageCount: 1,
      createdAt: now,
      updatedAt: now,
      status: 'saved',
      statusLabel: '已保存',
      attempts: 0,
      source: 'lumi_space',
      contentMode: 'paper_only',
    };
  });

  useEffect(() => {
    if (screen !== 'sending') return;
    const timer = window.setTimeout(() => {
      setNetwork(null);
      setConnectedPrinter(null);
      setScreen('interrupted');
    }, 750);
    return () => window.clearTimeout(timer);
  }, [screen]);

  const viewport = document.getElementById('app-viewport');
  if (!viewport) return null;

  const completeInterruption = () => {
    setScreen(interruption === 'before-send' ? 'connection' : null);
    setInterruption(null);
  };

  return createPortal(
    <div className="absolute inset-0 z-[1000] isolate overflow-hidden bg-slate-50">
      <div className="h-full" inert={screen !== null}>
        <MyPrintedFilesPage
          onBack={onClose}
          demo={{ file, loadDocument: loadDemoPdf, printerConnection: {
            connectedPrinter,
            printIssue: demoPrintIssues[scenario],
            lowSupply: scenario === 'low-supply',
            onOpen: () => setScreen('connection'),
            onSubmit: () => {
              if (!interruption) return false;
              setScreen('sending');
              return true;
            },
          } }}
        />
      </div>
      {(screen === 'connection' || screen === 'search') && <PrinterConnectionDemo
        network={network}
        connectedPrinter={connectedPrinter}
        autoSearch={screen === 'search'}
        issue={printerIssue}
        onIssueShown={() => setPrinterIssue(null)}
        onWifi={setScreen}
        onConnected={setConnectedPrinter}
        onClose={() => setScreen(null)}
      />}
      {(screen === 'wifi' || screen === 'hotspot') && <PrinterDemoWifi
        current={network}
        enabled={wifiEnabled}
        hotspot={screen === 'hotspot'}
        showHiddenHint={scenario === 'hidden-wifi'}
        issue={wifiIssue}
        onToggle={() => {
          if (wifiEnabled) { setNetwork(null); setConnectedPrinter(null); }
          setWifiEnabled(!wifiEnabled);
        }}
        onIssueShown={() => setWifiIssue(null)}
        onConnected={(next) => {
          setNetwork(next);
          setConnectedPrinter(null);
          if (printerIssue === 'no-printers') setPrinterIssue(null);
          setScreen('search');
        }}
        onBack={() => setScreen('connection')}
      />}
      {(screen === 'sending' || screen === 'interrupted') && (
        <div className="absolute inset-0 z-[600] grid place-items-center bg-slate-900/50 p-5">
          <section role="dialog" aria-labelledby="print-demo-result" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            {screen === 'sending' ? <>
              <LoaderCircle size={28} className="mx-auto animate-spin text-blue-600" />
              <h2 id="print-demo-result" className="mt-3 font-semibold">正在发送打印任务…</h2>
            </> : <>
              <AlertTriangle size={28} className="mx-auto text-amber-600" />
              <h2 id="print-demo-result" className="mt-3 font-semibold">{interruption === 'before-send' ? '网络已断开，任务尚未发送' : '任务已发送，结果待确认'}</h2>
              <p className="mt-2 text-sm text-slate-600">{interruption === 'before-send' ? 'PDF 和打印设置已保留。重新连接后可以再次发送。' : '发送后网络中断。请先查看打印机是否已出纸或仍在处理，避免重复打印。'}</p>
              <button type="button" onClick={completeInterruption} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{interruption === 'before-send' ? '重新连接' : '我已检查打印机'}</button>
            </>}
          </section>
        </div>
      )}
    </div>,
    viewport,
  );
};
