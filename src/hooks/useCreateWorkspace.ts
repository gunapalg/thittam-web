import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export type WorkspaceType = 'ROOT' | 'DEPARTMENT' | 'COMMITTEE' | 'TEAM';

export interface CreateWorkspaceParams {
  name: string;
  eventId: string;
  workspaceType?: WorkspaceType;
  parentWorkspaceId?: string | null;
  departmentId?: string | null;
  organizationId?: string;
}

export interface CreatedWorkspace {
  id: string;
  name: string;
  eventId: string;
  workspaceType: WorkspaceType;
  parentWorkspaceId: string | null;
  departmentId: string | null;
  organizerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook for creating individual workspaces
 * Supports the 4-level hierarchy: ROOT > DEPARTMENT > COMMITTEE > TEAM
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (params: CreateWorkspaceParams): Promise<CreatedWorkspace> => {
      if (!user?.id) {
        throw new Error('Must be authenticated to create a workspace');
      }

      const { name, eventId, workspaceType = 'ROOT', parentWorkspaceId = null, departmentId = null } = params;

      // Validate hierarchy rules
      if (workspaceType === 'ROOT') {
        // Check if a ROOT workspace already exists for this event
        const { data: existingRoot, error: checkError } = await supabase
          .from('workspaces')
          .select('id')
          .eq('event_id', eventId)
          .eq('workspace_type', 'ROOT')
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingRoot) {
          throw new Error('A root workspace already exists for this event');
        }
      }

      if (workspaceType !== 'ROOT' && !parentWorkspaceId) {
        throw new Error(`${workspaceType} workspace requires a parent workspace`);
      }

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          event_id: eventId,
          workspace_type: workspaceType,
          parent_workspace_id: parentWorkspaceId,
          department_id: departmentId,
          organizer_id: user.id,
          status: 'ACTIVE',
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        eventId: data.event_id,
        workspaceType: (data.workspace_type || 'ROOT') as WorkspaceType,
        parentWorkspaceId: data.parent_workspace_id,
        departmentId: data.department_id,
        organizerId: data.organizer_id,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    onSuccess: (workspace, params) => {
      toast.success(`${workspace.workspaceType.toLowerCase()} workspace "${workspace.name}" created`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['workspaces', params.eventId] });
      queryClient.invalidateQueries({ queryKey: ['org-workspaces'] });
      
      if (params.parentWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspace-children', params.parentWorkspaceId] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create workspace');
    },
  });

  return {
    createWorkspace: mutation.mutate,
    createWorkspaceAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    createdWorkspace: mutation.data,
  };
}
