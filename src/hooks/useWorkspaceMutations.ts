import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskPriority, TaskStatus, WorkspaceRoleScope } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TablesInsert } from '@/integrations/supabase/types';

interface UseWorkspaceMutationsProps {
  workspaceId: string | undefined;
  eventId?: string;
  activeRoleSpace?: WorkspaceRoleScope;
}

/**
 * Shared hook for workspace mutations (task CRUD, event publish, role views)
 * Used by both desktop and mobile workspace dashboards
 */
export function useWorkspaceMutations({
  workspaceId,
  eventId,
  activeRoleSpace = 'ALL',
}: UseWorkspaceMutationsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      const { data, error } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: workspaceId,
          title: 'New task',
          description: '',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.NOT_STARTED,
          role_scope: activeRoleSpace === 'ALL' ? null : activeRoleSpace,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
  });

  // Update task status
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status })
        .eq('id', taskId)
        .eq('workspace_id', workspaceId as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .delete()
        .eq('id', taskId)
        .eq('workspace_id', workspaceId as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
  });

  // Publish event
  const publishEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('No event linked to this workspace');

      const { error } = await supabase
        .from('events')
        .update({ status: 'PUBLISHED' })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Event published',
        description: 'Your event has been marked as published.',
      });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to publish event',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Upsert role view
  type WorkspaceRoleViewInsert = TablesInsert<'workspace_role_views'>;

  const upsertRoleViewMutation = useMutation({
    mutationFn: async ({
      roleScope,
      lastActiveTab,
    }: {
      roleScope: WorkspaceRoleScope;
      lastActiveTab: string;
    }) => {
      if (!workspaceId || !user?.id) return;

      const payload: WorkspaceRoleViewInsert = {
        workspace_id: workspaceId,
        user_id: user.id,
        role_scope: roleScope,
        last_active_tab: lastActiveTab,
      };

      const { error } = await supabase
        .from('workspace_role_views')
        .upsert(payload, { onConflict: 'workspace_id,user_id,role_scope' });

      if (error) throw error;
    },
  });

  return {
    createTask: () => createTaskMutation.mutate(),
    isCreatingTask: createTaskMutation.isPending,
    updateTaskStatus: (taskId: string, status: TaskStatus) =>
      updateTaskStatusMutation.mutate({ taskId, status }),
    deleteTask: (taskId: string) => deleteTaskMutation.mutate(taskId),
    publishEvent: () => publishEventMutation.mutate(),
    isPublishingEvent: publishEventMutation.isPending,
    upsertRoleView: (roleScope: WorkspaceRoleScope, lastActiveTab: string) =>
      upsertRoleViewMutation.mutate({ roleScope, lastActiveTab }),
  };
}
