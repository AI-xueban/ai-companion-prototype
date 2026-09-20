
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

interface TeacherAppProps {
    onSwitchBack: () => void;
}

export const TeacherApp: React.FC<TeacherAppProps> = ({ onSwitchBack }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [loggedIn, setLoggedIn] = useState(true);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);

  const unreadMessageCount = useMemo(
    () => messages.filter((message) => message.type !== 'PSYCHOLOGY' && message.status === 'open').length,
    [],
  );

  const handleLogout = () => {
      setLoggedIn(false);
  };

  const handleOpenInbox = () => {
    setIsMessageDrawerOpen(true);
  };

  const renderContent = () => {
      switch (activePage) {
          case 'dashboard':
              return <TeacherDashboard onNavigateAnalytics={() => setActivePage('analytics')} />;
          case 'analytics':
              return <TeacherAnalytics />;
          case 'profiles':
              return <StudentProfiles />;
          case 'incentives':
              return <ClassIncentives />;
          case 'inbox':
              return <SmartInbox />;
          case 'profile':
              return <TeacherProfile />;
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
        onLogin={() => {
          setLoggedIn(true);
          setActivePage('dashboard');
        }}
        onBack={onSwitchBack}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#F8F9FC] text-gray-900 overflow-hidden font-sans">
      
      {/* 1. Sidebar (Fixed Left) */}
      <TeacherSidebar 
        activePage={activePage} 
        onNavigate={(page) => {
            setActivePage(page);
        }} 
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area (Flex Right) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header（个人中心和消息页隐藏班级切换条） */}
        {activePage !== 'profile' && activePage !== 'inbox' && (
          <TeacherHeader
            unreadMessageCount={unreadMessageCount}
            onOpenInbox={handleOpenInbox}
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
