import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceStatus, UserRole } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { WorkspaceDashboard } from '@/components/workspace/WorkspaceDashboard';
import { useAuth } from '@/hooks/useAuth';

/**
 * OrgWorkspacePage
 *
 * Organization-scoped workspace portal for the route `/:orgSlug/workspaces`.
 * Shows workspace list and full workspace dashboard when one is selected.
 * Supports filtering by eventId via query param.
 */
export const OrgWorkspacePage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const eventIdFilter = searchParams.get('eventId') || undefined;
  const selectedWorkspaceId = searchParams.get('workspaceId') || undefined;

  const baseWorkspacePath = `/${orgSlug}/workspaces`;

  // Load workspaces the current user can access
  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ['org-workspaces', organization?.id, eventIdFilter],
    queryFn: async () => {
      if (!organization?.id) return [] as Workspace[];

      let query = supabase
        .from('workspaces')
        .select(
          'id, name, status, created_at, updated_at, event_id, events!inner(id, name, organization_id)'
        )
        .eq('events.organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (eventIdFilter) {
        query = query.eq('event_id', eventIdFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return ((data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        description: undefined,
        event: row.events
          ? {
            id: row.events.id,
            name: row.events.name,
          }
          : undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
      })) as unknown) as Workspace[];
    },
    enabled: !!organization?.id,
  });

  // Get event name if filtering by event
  const { data: filteredEvent } = useQuery({
    queryKey: ['event-name', eventIdFilter],
    queryFn: async () => {
      if (!eventIdFilter) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', eventIdFilter)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventIdFilter,
  });

  // Auto-select first workspace if none selected and workspaces exist
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces && workspaces.length > 0) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', workspaces[0].id);
        return next;
      }, { replace: true });
    }
  }, [selectedWorkspaceId, workspaces, setSearchParams]);

  const canManageWorkspaces =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const handleClearEventFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('eventId');
      next.delete('workspaceId');
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-2">
        <OrganizationBreadcrumbs
          items={[
            {
              label: organization?.name ?? 'Organization',
              href: orgSlug ? `/${orgSlug}` : undefined,
            },
            {
              label: 'Workspaces',
              isCurrent: !eventIdFilter,
              href: eventIdFilter ? baseWorkspacePath : undefined,
            },
            ...(eventIdFilter && filteredEvent
              ? [{ label: filteredEvent.name, isCurrent: true }]
              : []),
          ]}
          className="text-xs"
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {eventIdFilter && filteredEvent
                ? `${filteredEvent.name} Workspaces`
                : 'Organization Workspaces'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {eventIdFilter
                ? 'Manage workspaces for this event with tasks, team, and communication.'
                : 'Use workspaces to organize collaboration around your events.'}
            </p>
          </div>
          {eventIdFilter && (
            <button
              type="button"
              onClick={handleClearEventFilter}
              className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              View all workspaces
            </button>
          )}
        </div>
      </header>

      {/* Workspace dashboard */}
      <main className="min-h-[400px]">
        {selectedWorkspaceId ? (
          <WorkspaceDashboard workspaceId={selectedWorkspaceId} orgSlug={orgSlug} />
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-base font-semibold text-foreground mb-2">Select a workspace</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Choose a workspace from the list to view tasks, team members, and communication.
              {canManageWorkspaces && eventIdFilter && ' Or create a new one to get started.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrgWorkspacePage;
