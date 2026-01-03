import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  MessageSquare,
  BarChart3
} from 'lucide-react';

import { MobileTaskSummary } from './MobileTaskSummary';
import { MobileTeamOverview } from './MobileTeamOverview';
import { MobileWorkspaceHeader } from './MobileWorkspaceHeader';
import { MobileNavigation } from './MobileNavigation';
import { MobileFeaturesPanel } from './MobileFeaturesPanel';
import { useWorkspaceShell } from '@/hooks/useWorkspaceShell';

interface MobileWorkspaceDashboardProps {
  workspaceId?: string;
  orgSlug?: string;
}

export function MobileWorkspaceDashboard({ workspaceId, orgSlug }: MobileWorkspaceDashboardProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'overview' | 'tasks' | 'team' | 'communication' | 'analytics'>('overview');

  // Use shared shell hook
  const { state, actions } = useWorkspaceShell({ workspaceId, orgSlug });
  const { workspace, userWorkspaces, isLoading, error } = state;

  const handleQuickAction = (action: string) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'create-task':
        actions.handleCreateTask();
        break;
      case 'invite-member':
        actions.handleInviteTeamMember();
        break;
      case 'view-tasks':
        setMobileActiveTab('tasks');
        break;
      case 'view-team':
        setMobileActiveTab('team');
        break;
      case 'view-communication':
        setMobileActiveTab('communication');
        break;
      case 'view-analytics':
        setMobileActiveTab('analytics');
        break;
      case 'settings':
        actions.handleManageSettings();
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">Workspace Not Found</h2>
          <p className="text-muted-foreground mb-4 text-sm">The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col overflow-y-auto">
      {/* Mobile Header */}
      <MobileWorkspaceHeader
        workspace={workspace}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <MobileNavigation
          workspace={workspace}
          userWorkspaces={userWorkspaces}
          activeTab={mobileActiveTab}
          onTabChange={(tab) => {
            setMobileActiveTab(tab);
            setIsMenuOpen(false);
          }}
          onWorkspaceSwitch={(newWorkspaceId) => {
            actions.handleWorkspaceSwitch(newWorkspaceId);
            setIsMenuOpen(false);
          }}
          onQuickAction={handleQuickAction}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="w-full pt-16 pb-24 px-4 space-y-6">
        {mobileActiveTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <section aria-label="Workspace overview" className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Workspace overview</h2>
              <div className="grid grid-cols-1 gap-3">
                {/* Tasks Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-tasks')}
                  className="w-full text-left rounded-2xl bg-card shadow-sm border border-border p-4 flex items-center justify-between active:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Tasks</p>
                      <p className="text-xs text-muted-foreground">View and update all workspace tasks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {workspace.taskSummary?.total ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </button>

                {/* Team Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-team')}
                  className="w-full text-left rounded-2xl bg-card shadow-sm border border-border p-4 flex items-center justify-between active:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Team</p>
                      <p className="text-xs text-muted-foreground">See who is in your workspace</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {workspace.teamMembers?.length ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">members</p>
                  </div>
                </button>

                {/* Communication Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-communication')}
                  className="w-full text-left rounded-2xl bg-card shadow-sm border border-border p-4 flex items-center justify-between active:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Communication</p>
                      <p className="text-xs text-muted-foreground">Jump into workspace conversations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-primary">Open</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Existing rich panels below the overview cards */}
            <MobileFeaturesPanel
              workspaceId={workspace.id}
              onLocationUpdate={(location) => {
                console.log('Location updated:', location);
              }}
              onPhotoCapture={(file) => {
                console.log('Photo captured:', file.name);
              }}
              onVoiceRecording={(audioBlob) => {
                console.log('Voice recording captured:', audioBlob.size, 'bytes');
              }}
            />

            <MobileTaskSummary
              workspace={workspace}
              onViewTasks={() => handleQuickAction('view-tasks')}
            />

            <MobileTeamOverview
              workspace={workspace}
              onViewTeam={() => handleQuickAction('view-team')}
            />
          </div>
        )}

        {mobileActiveTab === 'tasks' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Tasks</h2>
            <p className="text-muted-foreground text-sm">Mobile task management interface will be implemented in the next component.</p>
          </div>
        )}

        {mobileActiveTab === 'team' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Team</h2>
            <p className="text-muted-foreground text-sm">Mobile team management interface will be implemented in the next component.</p>
          </div>
        )}

        {mobileActiveTab === 'communication' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Communication</h2>
            <p className="text-muted-foreground text-sm">Mobile communication interface will be implemented in the next component.</p>
          </div>
        )}

        {mobileActiveTab === 'analytics' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Analytics</h2>
            <p className="text-muted-foreground text-sm">Mobile analytics interface will be implemented in the next component.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 pb-safe">
        <div className="flex justify-around">
          <button
            onClick={() => setMobileActiveTab('overview')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${mobileActiveTab === 'overview'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs mt-1">Overview</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('tasks')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${mobileActiveTab === 'tasks'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs mt-1">Tasks</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('team')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${mobileActiveTab === 'team'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs mt-1">Team</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('communication')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${mobileActiveTab === 'communication'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs mt-1">Chat</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('analytics')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${mobileActiveTab === 'analytics'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs mt-1">Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
}
