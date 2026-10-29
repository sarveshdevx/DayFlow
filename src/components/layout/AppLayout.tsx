import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useUIStore } from '../../store/useUIStore';
import { InboxView } from '../inbox/InboxView';
import { TodayView } from '../views/TodayView';
import { UpcomingView } from '../views/UpcomingView';
import { ProjectView } from '../views/ProjectView';
import { FiltersLabelsView } from '../views/FiltersLabelsView';
import { QuickAddModal } from '../task/QuickAddModal';
import { BackupModal } from '../backup/BackupModal';

export const AppLayout: React.FC = () => {
  const { currentView, selectedProjectId } = useUIStore();

  const getViewTitle = () => {
    switch (currentView) {
      case 'inbox':
        return 'Inbox';
      case 'today':
        return 'Today';
      case 'upcoming':
        return 'Upcoming';
      case 'filters-labels':
        return 'Filters & Labels';
      case 'project':
        return 'Project';
      default:
        return 'TaskFlow';
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'inbox':
        return <InboxView />;
      case 'today':
        return <TodayView />;
      case 'upcoming':
        return <UpcomingView />;
      case 'filters-labels':
        return <FiltersLabelsView />;
      case 'project':
        return selectedProjectId ? <ProjectView projectId={selectedProjectId} /> : <InboxView />;
      default:
        return <InboxView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1e1e1e] text-[#f2f2f2]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopNav title={getViewTitle()} />
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <QuickAddModal />
      <BackupModal />
    </div>
  );
};
