
import React, { useState, useMemo } from 'react';
import { TeacherSidebar } from './Layout/TeacherSidebar';
import { TeacherHeader } from './Layout/TeacherHeader';
import { TeacherDashboard } from './Dashboard/TeacherDashboard';
import { StudentProfiles } from './Classroom/StudentProfiles';
import { TeacherAnalytics } from './Analytics/TeacherAnalytics';
import { SmartInbox } from './Inbox/SmartInbox';
import { MessageDrawer } from './Inbox/MessageDrawer';
import { ClassIncentives } from './Incentives/ClassIncentives';
import { TeacherProfile } from './Profile/TeacherProfile';
import { TeacherLogin } from './Login/TeacherLogin.tsx';
import { messages } from './data/mockTeacherData';
import { PORTAL_CLASSES, TeacherPortalRole, TeacherPortalUser } from './data/teacherAccess';
import { SchoolAdminManagement } from './SchoolAdminManagement';
import { DeviceManagement } from './DeviceManagement/DeviceManagement';

interface TeacherAppProps {
    onSwitchBack: () => void;
    initialRole?: TeacherPortalRole;
}

export const TeacherApp: React.FC<TeacherAppProps> = ({ onSwitchBack, initialRole = 'teacher' }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [loggedIn, setLoggedIn] = useState(false);
  const [teacherUser, setTeacherUser] = useState<TeacherPortalUser | null>(null);
  const [currentClassId, setCurrentClassId] = useState('c1');
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);

  const unreadMessageCount = useMemo(
    () => messages.filter((message) => message.type !== 'PSYCHOLOGY' && message.status === 'open').length,
    [],
  );

  const handleLogout = () => {
      setLoggedIn(false);
      setTeacherUser(null);
      setActivePage('dashboard');
      localStorage.removeItem('mockTeacherToken');
  };

  const allowedPages: Record<TeacherPortalRole, string[]> = {
    teacher: ['dashboard', 'analytics', 'profiles', 'profile'],
    'class-teacher': ['dashboard', 'analytics', 'profiles', 'incentives', 'inbox', 'profile'],
    'school-admin': ['dashboard', 'analytics', 'profiles', 'incentives', 'inbox', 'profile', 'school', 'classes', 'teachers', 'students', 'device-overview', 'cabinet', 'tablet', 'device-usage', 'device-alert', 'face-library'],
  };
  const navigate = (page: string) => {
    if (teacherUser && allowedPages[teacherUser.role].includes(page)) setActivePage(page);
  };

  const handleOpenInbox = () => {
    setIsMessageDrawerOpen(true);
  };

  const renderContent = () => {
      if (!teacherUser) return null;
      switch (activePage) {
          case 'dashboard':
              return <TeacherDashboard onNavigateAnalytics={() => navigate('analytics')} scopeLabel={`${teacherUser.schoolName} · ${teacherUser.roleLabel}${teacherUser.role === 'school-admin' ? '（全校范围）' : `（${teacherUser.classIds.map((id) => PORTAL_CLASSES.find((item) => item.id === id)?.name).filter(Boolean).join('、')}）`}`} />;
          case 'analytics':
              return <TeacherAnalytics scopeLabel={`${teacherUser.schoolName} · ${teacherUser.role === 'school-admin' ? '全校' : (PORTAL_CLASSES.find((item) => item.id === currentClassId)?.name ?? '授权班级')}`} />;
          case 'profiles':
              return <StudentProfiles classNames={teacherUser.role === 'school-admin' ? undefined : [PORTAL_CLASSES.find((item) => item.id === currentClassId)?.name ?? '七年级(2)班']} />;
          case 'incentives':
              return <ClassIncentives />;
          case 'inbox':
              return <SmartInbox />;
          case 'profile':
              return <TeacherProfile />;
          case 'school': return <SchoolAdminManagement initialView="school" currentUser={teacherUser} />;
          case 'classes': return <SchoolAdminManagement initialView="classes" currentUser={teacherUser} />;
          case 'teachers': return <SchoolAdminManagement initialView="teachers" currentUser={teacherUser} />;
          case 'students': return <SchoolAdminManagement initialView="students" currentUser={teacherUser} />;
          case 'device-overview': return <DeviceManagement initialView="overview" currentUser={teacherUser} />;
          case 'cabinet': return <DeviceManagement initialView="cabinets" currentUser={teacherUser} />;
          case 'tablet': return <DeviceManagement initialView="tablets" currentUser={teacherUser} />;
          case 'device-usage': return <DeviceManagement initialView="usage" currentUser={teacherUser} />;
          case 'device-alert': return <DeviceManagement initialView="alerts" currentUser={teacherUser} />;
          case 'face-library': return <DeviceManagement initialView="faces" currentUser={teacherUser} />;
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
          setCurrentClassId(user.classIds[0] ?? 'c1');
          setLoggedIn(true);
          setActivePage('dashboard');
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
        activePage={activePage} 
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
          />
        )}

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-hidden">
            {renderContent()}
        </div>

      </div>

      {/* Message Drawer */}
      <MessageDrawer
        open={isMessageDrawerOpen}
        onClose={() => setIsMessageDrawerOpen(false)}
      />
    </div>
  );
};
