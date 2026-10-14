
import React, { useState, useMemo, useRef } from 'react';
import { TeacherSidebar } from './Layout/TeacherSidebar';
import { TeacherHeader } from './Layout/TeacherHeader';
import { SchoolLearningDashboard } from './Dashboard/SchoolLearningDashboard';
import { ClassLearningDashboard } from './Dashboard/ClassLearningDashboard';
import { LearningStudents } from './Classroom/LearningStudents';
import { LearningAnalytics, AnalysisTab } from './Analytics/LearningAnalytics';
import { LearningScopeBar, StudentLearningDetail } from './Analytics/LearningReportShared';
import { initialReportScope, queryReport, ReportScope, ReportView, getViews, Population } from './data/learningReportData';
import { SmartInbox } from './Inbox/SmartInbox';
import { MessageDrawer } from './Inbox/MessageDrawer';
import { ClassIncentives } from './Incentives/ClassIncentives';
import { TeacherProfile } from './Profile/TeacherProfile';
import { TeacherLogin } from './Login/TeacherLogin.tsx';
import { messages } from './data/mockTeacherData';
import { TeacherPortalRole, TeacherPortalUser } from './data/teacherAccess';
import { SchoolAdminManagement } from './SchoolAdminManagement';
import { DeviceManagement } from './DeviceManagement/DeviceManagement';

interface TeacherAppProps {
    onSwitchBack: () => void;
    initialRole?: TeacherPortalRole;
}

export const TeacherApp: React.FC<TeacherAppProps> = ({ onSwitchBack, initialRole = 'teacher' }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [deviceMenuPage, setDeviceMenuPage] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [teacherUser, setTeacherUser] = useState<TeacherPortalUser | null>(null);
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
  const reportData = useMemo(() => teacherUser ? queryReport(teacherUser, reportScope) : null, [teacherUser, reportScope]);
  const schoolData = useMemo(() => teacherUser?.role === 'school-admin' ? queryReport(teacherUser, schoolScope) : null, [teacherUser, schoolScope]);
  const isReportPage = ['dashboard', 'analytics', 'profiles', 'incentives'].includes(activePage);
  const isSchoolReport = activePage === 'school-learning';
  const scopeKey = JSON.stringify(reportScope);
  const schoolScopeKey = JSON.stringify(schoolScope);
  const changeScope = (scope: ReportScope) => {
    setReportScope(scope);
    setSelectedStudent(null);
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
      setActivePage('dashboard');
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
    return allowedPages[teacherUser.role].includes(page);
  };
  const navigate = (page: string) => {
    if (canOpenPage(page)) {
      setDeviceMenuPage(null);
      setSelectedStudent(null);
      if (page === 'school-learning') {
        setSchoolScope(scope => ({ ...scope, classId: 'all', subject: 'all' }));
        setSchoolPanel('overview');
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
              if (schoolPanel === 'analytics') return <LearningAnalytics key={schoolScopeKey} data={schoolData} scope={schoolScope} tab={schoolAnalysisTab} onTab={setSchoolAnalysisTab} feature={schoolFeature} onFeature={setSchoolFeature} onStudent={setSelectedStudent} />;
              if (schoolPanel === 'profiles') return <LearningStudents key={schoolScopeKey + schoolPopulation} data={schoolData} population={schoolPopulation} onPopulation={setSchoolPopulation} onStudent={setSelectedStudent} />;
              if (schoolPanel === 'class') return <ClassLearningDashboard scope={schoolScope} data={schoolData} onAnalyze={(tab, subject) => {
                setSchoolScope(scope => ({ ...scope, subject: subject ?? scope.subject })); setSchoolAnalysisTab(tab); setSchoolPanel('analytics');
              }} onStudents={filter => { setSchoolPopulation(filter); setSchoolPanel('profiles'); }} onStudent={setSelectedStudent} />;
              return <SchoolLearningDashboard user={teacherUser} scope={schoolScope} data={schoolData} onAnalyze={(changes, selectedFeature) => {
                setSchoolScope(scope => ({ ...scope, ...changes })); setSchoolFeature(selectedFeature ?? 'all'); setSchoolAnalysisTab('usage'); setSchoolPanel('analytics');
              }} onStudents={filter => { setSchoolPopulation(filter); setSchoolPanel('profiles'); }} onClass={classId => {
                setSchoolScope(scope => ({ ...scope, classId, subject: 'all' })); setSchoolPanel('class');
              }} />;
          case 'school-device-usage':
              return <div className="flex h-full flex-col"><div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 lg:px-8"><h1 className="text-2xl font-black text-slate-900">全校设备使用</h1><p className="mt-1 text-sm text-slate-500">{teacherUser.schoolName} · 查看平板借用、归还及异常记录；设备借用不等于学伴应用内学习。</p><div className="mt-4 flex gap-2">{([['overview','设备使用概览'],['usage','借还使用明细']] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={schoolDeviceTab === id} onClick={() => setSchoolDeviceTab(id)} className={`rounded-lg px-3 py-2 text-xs font-bold ${schoolDeviceTab === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>)}</div></div><div className="min-h-0 flex-1"><DeviceManagement initialView={schoolDeviceTab} currentUser={teacherUser} /></div></div>;
          case 'dashboard':
              return <ClassLearningDashboard scope={reportScope} data={reportData} onAnalyze={(tab, subject) => {
                setOverviewScope(reportScope); changeScope({ ...reportScope, subject: subject ?? reportScope.subject }); setAnalysisTab(tab); navigate('analytics');
              }} onStudents={filter => { setOverviewScope(reportScope); setPopulation(filter); navigate('profiles'); }} onStudent={setSelectedStudent} />;
          case 'analytics':
              return <LearningAnalytics key={scopeKey} data={reportData} scope={reportScope} tab={analysisTab} onTab={setAnalysisTab} feature={feature} onFeature={setFeature} onStudent={setSelectedStudent} />;
          case 'profiles':
              return <LearningStudents key={scopeKey + population} data={reportData} population={population} onPopulation={setPopulation} onStudent={setSelectedStudent} />;
          case 'incentives':
              return <ClassIncentives classId={reportScope.classId} className={reportData.classes[0]?.name ?? ''} canManage={reportScope.view === 'homeroom' && teacherUser.homeroomClassIds.includes(reportScope.classId)} />;
          case 'inbox':
              return <SmartInbox />;
          case 'profile':
              return <TeacherProfile />;
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
        onLogin={(user) => {
          setTeacherUser(user);
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
          setFeature('all');
          setCurrentClassId(user.classIds[0] ?? 'c1');
          setLoggedIn(true);
          setActivePage(user.role === 'school-admin' ? 'school-learning' : 'dashboard');
          setDeviceMenuPage(null);
        }}
        onBack={onSwitchBack}
      />
    );
  }

  if (!teacherUser) return null;

  return (
    <div className="flex h-screen w-screen bg-[#F8F9FC] text-gray-900 overflow-hidden font-sans">
      
      {/* 1. Sidebar (Fixed Left) */}
      <TeacherSidebar 
        activePage={deviceMenuPage ?? activePage}
        onNavigate={navigate}
        onLogout={handleLogout}
        user={teacherUser}
      />

      {/* 2. Main Content Area (Flex Right) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header（个人中心和消息页隐藏班级切换条） */}
        {activePage !== 'profile' && activePage !== 'inbox' && (
          <TeacherHeader
            unreadMessageCount={unreadMessageCount}
            onOpenInbox={handleOpenInbox}
            user={teacherUser}
            currentClassId={currentClassId}
            onClassChange={setCurrentClassId}
            showClassSelector={!isReportPage && !isSchoolReport && !['school-device-usage', 'device-overview', 'cabinet', 'tablet', 'device-usage', 'device-alert', 'face-library'].includes(activePage)}
            showMessages={!isReportPage && !isSchoolReport}
          />
        )}

        {isReportPage && <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-6 py-2 lg:px-8"><span className="text-xs font-bold text-slate-500">我的班级 · 当前职责</span>{getViews(teacherUser).filter(view => view !== 'school').map(view => <button key={view} type="button" aria-pressed={reportScope.view === view} onClick={() => switchWorkView(view)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${reportScope.view === view ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{view === 'homeroom' ? '班主任 · 本班全科' : '任课教师 · 任教班级学科'}</button>)}</div>}
        {isReportPage && <LearningScopeBar user={teacherUser} scope={reportScope} onChange={scope => {
          changeScope(scope);
          setOverviewScope({ ...scope, subject: scope.view === 'homeroom' ? 'all' : scope.subject });
        }} />}
        {isSchoolReport && <LearningScopeBar user={teacherUser} scope={schoolScope} onChange={scope => { setSelectedStudent(null); setSchoolScope(scope); setSchoolPanel(scope.classId === 'all' ? 'overview' : 'class'); }} />}
        {isSchoolReport && schoolPanel !== 'overview' && <div className="flex shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-6 lg:px-8"><button type="button" className="py-3 text-sm font-bold text-indigo-600" onClick={() => { setSelectedStudent(null); setSchoolScope(scope => ({ ...scope, classId: 'all', subject: 'all' })); setSchoolPanel('overview'); }}>← 返回全校学情</button>{schoolScope.classId !== 'all' && <nav aria-label="全校学情班级详情" className="flex gap-4">{([['class','班级概览'],['analytics','学习分析'],['profiles','学生明细']] as const).map(([panel,label]) => <button key={panel} type="button" onClick={() => setSchoolPanel(panel)} aria-current={schoolPanel === panel ? 'page' : undefined} className={`border-b-2 px-1 py-3 text-sm font-bold ${schoolPanel === panel ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{label}</button>)}</nav>}</div>}
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-hidden">
            {renderContent()}
        </div>

      </div>

      {isReportPage && selectedStudent && reportData && <StudentLearningDetail key={selectedStudent + scopeKey} studentId={selectedStudent} data={reportData} scope={reportScope} onClose={() => setSelectedStudent(null)} />}
      {isSchoolReport && selectedStudent && schoolData && <StudentLearningDetail key={selectedStudent + schoolScopeKey} studentId={selectedStudent} data={schoolData} scope={schoolScope} onClose={() => setSelectedStudent(null)} />}
      {/* Message Drawer */}
      <MessageDrawer
        open={isMessageDrawerOpen}
        onClose={() => setIsMessageDrawerOpen(false)}
      />
    </div>
  );
};
