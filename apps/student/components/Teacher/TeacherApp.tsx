
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { TeacherSidebar } from './Layout/TeacherSidebar';
import { TeacherHeader } from './Layout/TeacherHeader';
import { SchoolLearningDashboard } from './Dashboard/SchoolLearningDashboard';
import { SchoolDataBoard } from './Dashboard/SchoolDataBoard';
import { ClassLearningDashboard } from './Dashboard/ClassLearningDashboard';
import { LearningStudents } from './Classroom/LearningStudents';
import { LearningAnalytics, AnalysisTab } from './Analytics/LearningAnalytics';
import { LearningScopeBar, StudentLearningDetail } from './Analytics/LearningReportShared';
import { initialReportScope, queryReport, ReportScope, ReportView, getViews, Population } from './data/learningReportData';
import { SmartInbox } from './Inbox/SmartInbox';
import { MessageDrawer } from './Inbox/MessageDrawer';
import { ClassIncentives } from './Incentives/ClassIncentives';
import { TeacherProfile } from './Profile/TeacherProfile';
import { TeacherLogin, SchoolAdminEntry } from './Login/TeacherLogin.tsx';
import { messages } from './data/mockTeacherData';
import type { ControlExceptionDemo } from './data/controlExceptionDemo';
import { DEMO_TEACHER_ACCOUNTS, TeacherPortalRole, TeacherPortalUser } from './data/teacherAccess';
import { SchoolAdminManagement } from './SchoolAdminManagement';
import { DeviceManagement } from './DeviceManagement/DeviceManagement';
import { SchoolDeviceControl } from './DeviceManagement/SchoolDeviceControl';

interface TeacherAppProps {
    onSwitchBack: () => void;
    initialRole?: TeacherPortalRole;
    controlException?: ControlExceptionDemo;
}

export const TeacherApp: React.FC<TeacherAppProps> = ({ onSwitchBack, initialRole = 'teacher', controlException }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [deviceNavOpen, setDeviceNavOpen] = useState(false);
  useEffect(() => {
    if (!deviceNavOpen) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setDeviceNavOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [deviceNavOpen]);
  const [deviceMenuPage, setDeviceMenuPage] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [teacherUser, setTeacherUser] = useState<TeacherPortalUser | null>(null);
  const [adminEntry, setAdminEntry] = useState<SchoolAdminEntry>('workbench');
  useEffect(() => {
    if (!controlException) return;
    setTeacherUser(DEMO_TEACHER_ACCOUNTS.find(user => user.role === 'school-admin')!);
    setLoggedIn(true);
    setActivePage('school-device-control');
    setDeviceMenuPage(null);
  }, [controlException]);
  const [currentClassId, setCurrentClassId] = useState('c1');
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [reportScope, setReportScope] = useState<ReportScope>({ view: 'teaching', classId: '', grade: 'all', subject: '', period: '7d' });
  const [overviewScope, setOverviewScope] = useState(reportScope);
  const workScopes = useRef<Partial<Record<ReportView, ReportScope>>>({});
  const [schoolScope, setSchoolScope] = useState<ReportScope>({ view: 'school', classId: 'all', grade: 'all', subject: 'all', period: '7d' });
  const [schoolPanel, setSchoolPanel] = useState<'overview' | 'class' | 'analytics' | 'profiles'>('overview');
  const [schoolAnalysisTab, setSchoolAnalysisTab] = useState<AnalysisTab>('usage');
  const [schoolFeature, setSchoolFeature] = useState('all');
  const [schoolPopulation, setSchoolPopulation] = useState<Population>('all');
  const [schoolDeviceTab, setSchoolDeviceTab] = useState<'overview' | 'usage'>('overview');
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('usage');
  const [feature, setFeature] = useState('all');
  const [population, setPopulation] = useState<Population>('all');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [reportDemoState, setReportDemoState] = useState<'normal' | 'loading' | 'failed' | 'delayed' | 'partial' | 'revoked'>('normal');
  const [boardPasswordOpen, setBoardPasswordOpen] = useState(false);
  const [boardPassword, setBoardPassword] = useState('');
  const [boardPasswordError, setBoardPasswordError] = useState('');
  const reportData = useMemo(() => teacherUser ? queryReport(teacherUser, reportScope) : null, [teacherUser, reportScope]);
  const schoolData = useMemo(() => teacherUser?.role === 'school-admin' ? queryReport(teacherUser, schoolScope) : null, [teacherUser, schoolScope]);
  const isReportPage = ['dashboard', 'analytics', 'profiles', 'incentives'].includes(activePage);
  const isSchoolReport = activePage === 'school-learning';
  const isLearningPage = isSchoolReport || ['dashboard', 'analytics', 'profiles'].includes(activePage);
  const scopeKey = JSON.stringify(reportScope);
  const schoolScopeKey = JSON.stringify(schoolScope);
  const changeScope = (scope: ReportScope) => {
    setReportScope(scope);
    setSelectedStudent(null);
    setReportDemoState('normal');
    setFeature('all');
    setPopulation('all');
  };
  const switchWorkView = (view: ReportView) => {
    if (!teacherUser || view === 'school' || !getViews(teacherUser).includes(view)) return;
    workScopes.current[reportScope.view] = { ...reportScope, subject: reportScope.view === 'homeroom' ? 'all' : reportScope.subject };
    const next = workScopes.current[view] ?? initialReportScope(teacherUser, view);
    changeScope(next);
    setOverviewScope(next);
    setAnalysisTab('usage');
  };

  const unreadMessageCount = useMemo(
    () => messages.filter((message) => message.type !== 'PSYCHOLOGY' && message.status === 'open').length,
    [],
  );

  const handleLogout = () => {
      setLoggedIn(false);
      setTeacherUser(null);
      setAdminEntry('workbench');
      setActivePage('dashboard');
      setBoardPasswordOpen(false);
      setBoardPassword('');
      setBoardPasswordError('');
      setDeviceMenuPage(null);
      localStorage.removeItem('mockTeacherToken');
  };

  const allowedPages: Record<TeacherPortalRole, string[]> = {
    teacher: ['dashboard', 'analytics', 'profiles', 'incentives', 'profile'],
    'class-teacher': ['dashboard', 'analytics', 'profiles', 'incentives', 'inbox', 'profile'],
    'school-admin': ['school-learning', 'school-device-usage', 'dashboard', 'analytics', 'profiles', 'incentives', 'inbox', 'profile', 'school', 'classes', 'teachers', 'students', 'device-overview', 'cabinet', 'tablet', 'device-usage', 'device-alert', 'face-library'],
  };
  const canOpenPage = (page: string) => {
    if (!teacherUser) return false;
    if (['dashboard', 'analytics', 'profiles', 'incentives'].includes(page) && !teacherUser.homeroomClassIds.length && !teacherUser.teachingAssignments.length) return false;
    return (page === 'school-device-control' && teacherUser.role === 'school-admin') || allowedPages[teacherUser.role].includes(page);
  };
  const navigate = (page: string) => {
    if (canOpenPage(page)) {
      setDeviceMenuPage(null);
      setSelectedStudent(null);
      if (page === 'school-learning') {
        setSchoolScope(scope => ({ ...scope, classId: 'all', subject: 'all' }));
        setSchoolPanel('overview');
        setSchoolFeature('all');
      }
      setActivePage(page);
    }
  };

  const handleOpenInbox = () => {
    setIsMessageDrawerOpen(true);
  };

  const renderContent = () => {
      if (!teacherUser || !reportData) return null;
      switch (activePage) {
          case 'school-learning':
              if (!schoolData) return null;
              if (schoolPanel === 'analytics') return <LearningAnalytics key={schoolScopeKey + schoolFeature} data={schoolData} scope={schoolScope} tab={schoolAnalysisTab} onTab={setSchoolAnalysisTab} feature={schoolFeature} onFeature={setSchoolFeature} onStudent={setSelectedStudent} />;
              if (schoolPanel === 'profiles') return <LearningStudents key={schoolScopeKey + schoolPopulation} data={schoolData} population={schoolPopulation} onPopulation={setSchoolPopulation} onStudent={setSelectedStudent} />;
              if (schoolPanel === 'class') return <ClassLearningDashboard scope={schoolScope} data={schoolData} onAnalyze={(tab, subject) => {
                setSchoolScope(scope => ({ ...scope, subject: subject ?? scope.subject })); setSchoolFeature('all'); setSchoolAnalysisTab(tab); setSchoolPanel('analytics');
              }} onStudents={filter => { setSchoolPopulation(filter); setSchoolPanel('profiles'); }} onStudent={setSelectedStudent} />;
              return <SchoolLearningDashboard user={teacherUser} scope={schoolScope} data={schoolData} onAnalyze={(changes, selectedFeature) => {
                setSchoolScope(scope => ({ ...scope, ...changes })); setSchoolFeature(selectedFeature ?? 'all'); setSchoolAnalysisTab('usage'); setSchoolPanel('analytics');
              }} onStudents={filter => { setSchoolPopulation(filter); setSchoolPanel('profiles'); }} onClass={classId => {
                setSchoolScope(scope => ({ ...scope, classId, subject: 'all' })); setSchoolFeature('all'); setReportDemoState('normal'); setSchoolPanel('class');
              }} />;
          case 'school-device-control':
              return teacherUser.role === 'school-admin' ? <SchoolDeviceControl key={controlException?.key} currentUser={teacherUser} demoScenario={controlException} /> : null;
          case 'school-device-usage':
              return <div className="flex h-full flex-col"><div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 lg:px-8"><h1 className="text-2xl font-black text-slate-900">全校设备使用</h1><p className="mt-1 text-sm text-slate-500">{teacherUser.schoolName} · 查看平板借用、归还及异常记录；设备借用不等于学伴应用内学习。</p><div className="mt-4 flex gap-2">{([['overview','设备使用概览'],['usage','借还使用明细']] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={schoolDeviceTab === id} onClick={() => setSchoolDeviceTab(id)} className={`rounded-lg px-3 py-2 text-xs font-bold ${schoolDeviceTab === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>)}</div></div><div className="min-h-0 flex-1"><DeviceManagement initialView={schoolDeviceTab} currentUser={teacherUser} /></div></div>;
          case 'dashboard':
              return <ClassLearningDashboard scope={reportScope} data={reportData} onAnalyze={(tab, subject) => {
                setOverviewScope(reportScope); changeScope({ ...reportScope, subject: subject ?? reportScope.subject }); setAnalysisTab(tab); navigate('analytics');
              }} onStudents={filter => { setOverviewScope(reportScope); setPopulation(filter); navigate('profiles'); }} onStudent={setSelectedStudent} />;
          case 'analytics':
              return <LearningAnalytics key={scopeKey + feature} data={reportData} scope={reportScope} tab={analysisTab} onTab={setAnalysisTab} feature={feature} onFeature={setFeature} onStudent={setSelectedStudent} />;
          case 'profiles':
              return <LearningStudents key={scopeKey + population} data={reportData} population={population} onPopulation={setPopulation} onStudent={setSelectedStudent} />;
          case 'incentives':
              return <ClassIncentives classId={reportScope.classId} className={reportData.classes[0]?.name ?? ''} canManage={reportScope.view === 'homeroom' && teacherUser.homeroomClassIds.includes(reportScope.classId)} />;
          case 'inbox':
              return <SmartInbox />;
          case 'profile':
              return <TeacherProfile user={teacherUser} />;
          case 'school': return <SchoolAdminManagement initialView="school" currentUser={teacherUser} onNavigate={navigate} />;
          case 'classes': return <SchoolAdminManagement initialView="classes" currentUser={teacherUser} onNavigate={navigate} />;
          case 'teachers': return <SchoolAdminManagement initialView="teachers" currentUser={teacherUser} onNavigate={navigate} />;
          case 'students': return <SchoolAdminManagement initialView="students" currentUser={teacherUser} onNavigate={navigate} />;
          case 'device-overview': return <DeviceManagement initialView="overview" currentUser={teacherUser} onMenuNavigate={setDeviceMenuPage} />;
          case 'cabinet': return <DeviceManagement initialView="cabinets" currentUser={teacherUser} onMenuNavigate={setDeviceMenuPage} />;
          case 'tablet': return <DeviceManagement initialView="tablets" currentUser={teacherUser} onMenuNavigate={setDeviceMenuPage} />;
          case 'device-usage': return <DeviceManagement initialView="usage" currentUser={teacherUser} onMenuNavigate={setDeviceMenuPage} />;
          case 'face-library': return <DeviceManagement initialView="faces" currentUser={teacherUser} onMenuNavigate={setDeviceMenuPage} />;
          default:
              return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-4 animate-pulse"></div>
                    <p className="font-bold">模块 "{activePage}" 开发中...</p>
                </div>
              );
      }
  };

  if (!loggedIn) {
    return (
      <TeacherLogin 
        initialRole={initialRole}
        onLogin={(user, entry) => {
          setTeacherUser(user);
          setAdminEntry(entry);
          const personalView: ReportView = user.homeroomClassIds.length ? 'homeroom' : 'teaching';
          const personalScope = initialReportScope(user, personalView);
          setReportScope(personalScope);
          setOverviewScope(personalScope);
          workScopes.current = {};
          setSchoolScope(initialReportScope(user, 'school'));
          setSchoolPanel('overview');
          setSchoolFeature('all');
          setSchoolPopulation('all');
          setPopulation('all');
          setSelectedStudent(null);
          setReportDemoState('normal');
          setFeature('all');
          setCurrentClassId(user.classIds[0] ?? 'c1');
          setLoggedIn(true);
          setActivePage(user.role === 'school-admin' ? 'school' : 'dashboard');
          setDeviceMenuPage(null);
        }}
        onBack={onSwitchBack}
      />
    );
  }

  if (!teacherUser) return null;

  if (teacherUser.role === 'school-admin' && adminEntry === 'board') {
    return <SchoolDataBoard user={teacherUser} onLogout={handleLogout} onEnterWorkbench={() => { setAdminEntry('workbench'); setActivePage('school'); }} />;
  }

  return (
    <div className={`flex h-screen w-screen bg-[#F8F9FC] text-gray-900 overflow-hidden font-sans ${activePage === 'school-device-control' ? 'dc-shell' : ''}`} data-nav-open={deviceNavOpen}>
      {activePage === 'school-device-control' && deviceNavOpen && <button type="button" className="dc-nav-backdrop" aria-label="关闭导航菜单" onClick={() => setDeviceNavOpen(false)} />}
      {activePage === 'school-device-control' && deviceNavOpen && <button type="button" className="dc-nav-close" aria-label="收起导航菜单" onClick={() => setDeviceNavOpen(false)}><X size={18} /></button>}
      
      {/* 1. Sidebar (Fixed Left) */}
      <TeacherSidebar 
        activePage={deviceMenuPage ?? activePage}
        onNavigate={page => { navigate(page); setDeviceNavOpen(false); }}
        onSwitchToBoard={teacherUser.role === 'school-admin' ? () => { setBoardPasswordOpen(true); setBoardPassword(''); setBoardPasswordError(''); } : undefined}
        user={teacherUser}
      />

      {/* 2. Main Content Area (Flex Right) */}
      <div className="flex-1 flex flex-col min-w-0">
        {activePage === 'school-device-control' && <div className="dc-mobile-bar"><button type="button" aria-label="打开导航菜单" aria-controls="teacher-sidebar" aria-expanded={deviceNavOpen} onClick={() => setDeviceNavOpen(open => !open)}><Menu size={17} />菜单</button><span>学校管理</span></div>}

        {/* Header（账号入口始终保留，个人中心和消息页隐藏班级切换条） */}
        {(
          <TeacherHeader
            unreadMessageCount={unreadMessageCount}
            onOpenInbox={handleOpenInbox}
            onOpenProfile={() => navigate('profile')}
            onLogout={handleLogout}
            user={teacherUser}
            currentClassId={currentClassId}
            onClassChange={setCurrentClassId}
            showClassSelector={!['profile', 'inbox'].includes(activePage) && !isReportPage && !isSchoolReport && !['school-device-control', 'school-device-usage', 'device-overview', 'cabinet', 'tablet', 'device-usage', 'device-alert', 'face-library'].includes(activePage)}
            showMessages={!['profile', 'inbox'].includes(activePage) && !isReportPage && !isSchoolReport}
          />
        )}

        {isReportPage && <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-6 py-2 lg:px-8"><span className="text-xs font-bold text-slate-500">我的班级 · 当前职责</span>{getViews(teacherUser).filter(view => view !== 'school').map(view => <button key={view} type="button" aria-pressed={reportScope.view === view} onClick={() => switchWorkView(view)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${reportScope.view === view ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{view === 'homeroom' ? '班主任 · 本班全科' : '任课教师 · 任教班级学科'}</button>)}</div>}
        {isReportPage && <LearningScopeBar user={teacherUser} scope={reportScope} onChange={scope => {
          changeScope(scope);
          setOverviewScope({ ...scope, subject: scope.view === 'homeroom' ? 'all' : scope.subject });
        }} />}
        {isSchoolReport && <LearningScopeBar user={teacherUser} scope={schoolScope} onChange={scope => { setSelectedStudent(null); setSchoolFeature('all'); setReportDemoState('normal'); setSchoolScope(scope); setSchoolPanel(scope.classId === 'all' ? 'overview' : 'class'); }} />}
        {isSchoolReport && schoolPanel !== 'overview' && <div className="flex shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-6 lg:px-8"><button type="button" className="py-3 text-sm font-bold text-indigo-600" onClick={() => { setSelectedStudent(null); setSchoolFeature('all'); setSchoolScope(scope => ({ ...scope, classId: 'all', subject: 'all' })); setSchoolPanel('overview'); }}>← 返回全校学情</button>{schoolScope.classId !== 'all' && <nav aria-label="全校学情班级详情" className="flex gap-4">{([['class','班级概览'],['analytics','学习分析'],['profiles','学生明细']] as const).map(([panel,label]) => <button key={panel} type="button" onClick={() => setSchoolPanel(panel)} aria-current={schoolPanel === panel ? 'page' : undefined} className={`border-b-2 px-1 py-3 text-sm font-bold ${schoolPanel === panel ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{label}</button>)}</nav>}</div>}
        {isLearningPage && <div className="flex shrink-0 items-center justify-end gap-2 border-b border-slate-100 bg-white px-6 py-2 text-xs text-slate-500"><label htmlFor="report-demo-state">演示数据状态</label><select id="report-demo-state" value={reportDemoState} onChange={event => { setSelectedStudent(null); setReportDemoState(event.target.value as typeof reportDemoState); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"><option value="normal">正常</option><option value="loading">加载中</option><option value="failed">加载失败</option><option value="delayed">同步延迟</option><option value="partial">部分来源未接入</option><option value="revoked">授权已撤销</option></select></div>}
        {isLearningPage && (reportDemoState === 'delayed' || reportDemoState === 'partial') && <div role="status" className="shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">{reportDemoState === 'delayed' ? '演示：部分记录仍待同步；当前数字仅截至 2026-10-12，补报后应按实际发生日期重算。' : '演示：仅接入同步微课、自主练习、错题订正和 AI 解题样例；其他功能尚未接入，不能将空白解释为未使用。'}</div>}
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-hidden">
            {isLearningPage && ['loading', 'failed', 'revoked'].includes(reportDemoState) ? <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#F8F9FC] p-8 text-center"><h2 className="text-lg font-bold text-slate-800">{reportDemoState === 'loading' ? '正在加载当前范围的学情' : reportDemoState === 'failed' ? '学情加载失败' : '当前范围已无查看权限'}</h2><p className="text-sm text-slate-500">{reportDemoState === 'loading' ? '模拟接口等待；不沿用上一范围的统计数字。' : reportDemoState === 'failed' ? '模拟数据请求失败；请重试当前范围。' : '模拟授权变更；旧详情已关闭，当前范围的数据不再展示。'}</p>{reportDemoState !== 'revoked' && <button type="button" onClick={() => setReportDemoState('normal')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">{reportDemoState === 'loading' ? '完成加载' : '重试'}</button>}</div> : renderContent()}
        </div>

      </div>

      {isReportPage && reportDemoState !== 'revoked' && selectedStudent && reportData && <StudentLearningDetail key={selectedStudent + scopeKey} studentId={selectedStudent} data={reportData} scope={reportScope} onClose={() => setSelectedStudent(null)} />}
      {isSchoolReport && reportDemoState !== 'revoked' && selectedStudent && schoolData && <StudentLearningDetail key={selectedStudent + schoolScopeKey} studentId={selectedStudent} data={schoolData} scope={schoolScope} onClose={() => setSelectedStudent(null)} />}
      {/* Message Drawer */}
      <MessageDrawer
        open={isMessageDrawerOpen}
        onClose={() => setIsMessageDrawerOpen(false)}
      />
      {boardPasswordOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setBoardPasswordOpen(false); }}><form onSubmit={event => { event.preventDefault(); const matched = DEMO_TEACHER_ACCOUNTS.some(item => item.id === teacherUser.id && item.password === boardPassword); if (!matched) { setBoardPasswordError('密码不正确，请重新输入'); return; } setBoardPasswordOpen(false); setBoardPassword(''); setBoardPasswordError(''); setAdminEntry('board'); }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black text-slate-900">验证身份后切换</h2><p className="mt-2 text-sm leading-6 text-slate-500">将从学校管理工作台进入只读的全校数据看板，请输入当前管理员密码。</p><label className="mt-5 block text-xs font-bold text-slate-700">当前账号密码<input type="password" autoFocus value={boardPassword} onChange={event => { setBoardPassword(event.target.value); setBoardPasswordError(''); }} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /></label>{boardPasswordError && <p role="alert" className="mt-2 text-xs text-red-600">{boardPasswordError}</p>}<div className="mt-5 flex gap-3"><button type="button" onClick={() => setBoardPasswordOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600">取消</button><button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white">验证并切换</button></div></form></div>}
    </div>
  );
};
