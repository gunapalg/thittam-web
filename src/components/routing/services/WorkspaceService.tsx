import React from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { WorkspaceServiceDashboard } from './WorkspaceServiceDashboard';
import { WorkspaceListPage } from './WorkspaceListPage';
import { WorkspaceDetailPage } from './WorkspaceDetailPage';
import { WorkspaceCreatePage } from './WorkspaceCreatePage';
import { OrgWorkspacePage } from '@/components/organization/OrgWorkspacePage';
import { OrgWorkspaceListPage } from '@/components/organization/OrgWorkspaceListPage';
import { WorkspaceSettingsPage } from '@/components/workspace/WorkspaceSettingsPage';

/**
 * WorkspaceService component provides the main routing structure for the Workspace Management Service.
 * It implements AWS-style service interface with:
 * - Service dashboard (landing page with workspace analytics)
 * - Resource list view (workspaces list)
 * - Resource detail view (workspace details with tabs for tasks, team, communication)
 * - Workspace context switching and navigation
 * 
 * Routes:
 * - /:orgSlug/workspaces - Organization workspace list (grouped by ownership)
 * - /:orgSlug/workspaces/:eventId - Event-specific workspace portal
 * - /:orgSlug/workspaces/:eventId/:workspaceId/* - Workspace detail views
 */

const WorkspaceIndexRoute: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const location = useLocation();
  
  // Check if we're in an org context by looking at the URL path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isOrgContext = pathParts.length >= 1 && pathParts[0] !== 'dashboard' && pathParts[0] !== 'console';

  // When under an organization route with eventId (/:orgSlug/workspaces/:eventId), 
  // render the organization-scoped workspace portal for that event.
  if (isOrgContext && eventId) {
    return <OrgWorkspacePage />;
  }

  // When under an organization route without eventId (/:orgSlug/workspaces),
  // show the organization workspace list grouped by ownership.
  if (isOrgContext) {
    return <OrgWorkspaceListPage />;
  }

  // For global dashboard routes (/dashboard/workspaces) use the generic service dashboard.
  return <WorkspaceServiceDashboard />;
};

export const WorkspaceService: React.FC = () => {
  return (
    <Routes>
      {/* Index route - determines which view to show based on context */}
      <Route index element={<WorkspaceIndexRoute />} />

      {/* Workspace List Page - for dashboard */}
      <Route path="list" element={<WorkspaceListPage />} />

      {/* Workspace Create Page - works for both /:orgSlug/workspaces/create and /dashboard/workspaces/create */}
      <Route path="create" element={<WorkspaceCreatePage />} />
      
      {/* Workspace Create with event pre-selected - /:orgSlug/workspaces/create/:eventId */}
      <Route path="create/:eventId" element={<WorkspaceCreatePage />} />

      {/* Event-specific workspace portal - /:orgSlug/workspaces/:eventId */}
      <Route path=":eventId" element={<WorkspaceIndexRoute />} />

      {/* Workspace Settings Page under event context - MUST come before general :workspaceId route */}
      <Route path=":eventId/:workspaceId/settings" element={<WorkspaceSettingsPage />} />

      {/* Workspace Detail with tabs under event context */}
      <Route path=":eventId/:workspaceId/tasks" element={<WorkspaceDetailPage defaultTab="tasks" />} />
      <Route path=":eventId/:workspaceId/team" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":eventId/:workspaceId/team/invite" element={<WorkspaceDetailPage defaultTab="team" />} />
      <Route path=":eventId/:workspaceId/communication" element={<WorkspaceDetailPage defaultTab="communication" />} />
      <Route path=":eventId/:workspaceId/analytics" element={<WorkspaceDetailPage defaultTab="analytics" />} />
      <Route path=":eventId/:workspaceId/reports" element={<WorkspaceDetailPage defaultTab="reports" />} />
      <Route path=":eventId/:workspaceId/marketplace" element={<WorkspaceDetailPage defaultTab="marketplace" />} />
      <Route path=":eventId/:workspaceId/templates" element={<WorkspaceDetailPage defaultTab="templates" />} />
      
      {/* General workspace detail - MUST come after more specific routes */}
      <Route path=":eventId/:workspaceId" element={<WorkspaceDetailPage />} />

      {/* Legacy routes without eventId - redirect to dashboard */}
      <Route path=":workspaceId/settings" element={<WorkspaceSettingsPage />} />
      <Route path=":workspaceId" element={<WorkspaceDetailPage />} />

      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/console/workspaces" replace />} />
    </Routes>
  );
};

export default WorkspaceService;
