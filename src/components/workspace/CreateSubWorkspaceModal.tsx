import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceType } from '@/types';
import {
  getResponsibleRoleForWorkspace,
  WORKSPACE_DEPARTMENTS,
  DEPARTMENT_COMMITTEES,
} from '@/lib/workspaceHierarchy';
import { 
  Building2, 
  Users, 
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateSubWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentWorkspaceId: string;
  eventId: string;
}

interface OptionItem {
  id: string;
  name: string;
  description?: string;
  type: 'department' | 'committee';
}

type TabType = 'department' | 'committee';

export function CreateSubWorkspaceModal({
  open,
  onOpenChange,
  parentWorkspaceId,
  eventId,
}: CreateSubWorkspaceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('department');
  const [selectedItems, setSelectedItems] = useState<OptionItem[]>([]);

  // Fetch parent workspace
  const { data: parentWorkspace } = useQuery({
    queryKey: ['workspace-parent', parentWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, department_id, parent_workspace_id')
        .eq('id', parentWorkspaceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!parentWorkspaceId,
  });

  // Get all departments
  const departmentOptions: OptionItem[] = useMemo(() => {
    return WORKSPACE_DEPARTMENTS.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      type: 'department' as const,
    }));
  }, []);

  // Get all committees
  const committeeOptions: OptionItem[] = useMemo(() => {
    const deptId = parentWorkspace?.department_id;
    if (deptId && DEPARTMENT_COMMITTEES[deptId]) {
      return DEPARTMENT_COMMITTEES[deptId].map(c => ({ 
        id: c.id, 
        name: c.name,
        type: 'committee' as const,
      }));
    }
    return Object.values(DEPARTMENT_COMMITTEES).flat().map(c => ({ 
      id: c.id, 
      name: c.name,
      type: 'committee' as const,
    }));
  }, [parentWorkspace?.department_id]);

  const currentOptions = activeTab === 'department' ? departmentOptions : committeeOptions;

  const toggleSelection = (item: OptionItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id && i.type === item.type);
      if (exists) {
        return prev.filter(i => !(i.id === item.id && i.type === item.type));
      }
      return [...prev, item];
    });
  };

  const isSelected = (item: OptionItem) => {
    return selectedItems.some(i => i.id === item.id && i.type === item.type);
  };

  const selectedDepartments = selectedItems.filter(i => i.type === 'department');
  const selectedCommittees = selectedItems.filter(i => i.type === 'committee');

  const createSubWorkspacesMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be authenticated');
      if (selectedItems.length === 0) throw new Error('Select at least one item');

      const createdWorkspaces: { id: string; name: string }[] = [];

      for (const item of selectedItems) {
        const workspaceType = item.type === 'department' 
          ? WorkspaceType.DEPARTMENT 
          : WorkspaceType.COMMITTEE;

        const departmentId = item.type === 'department' 
          ? item.id 
          : parentWorkspace?.department_id || null;

        const { data: workspace, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            name: item.name,
            event_id: eventId,
            parent_workspace_id: parentWorkspaceId,
            organizer_id: user.id,
            status: 'ACTIVE',
            workspace_type: workspaceType,
            department_id: departmentId,
          })
          .select('id, name')
          .single();

        if (wsError) throw wsError;

        const responsibleRole = getResponsibleRoleForWorkspace(
          workspaceType,
          departmentId || undefined,
          item.type === 'committee' ? item.id : undefined
        );

        if (responsibleRole) {
          await supabase
            .from('workspace_team_members')
            .insert({
              workspace_id: workspace.id,
              user_id: user.id,
              role: responsibleRole,
              status: 'active',
            });
        }

        createdWorkspaces.push(workspace);
      }

      return createdWorkspaces;
    },
    onSuccess: (data) => {
      const count = data.length;
      toast({
        title: `${count} workspace${count > 1 ? 's' : ''} created`,
        description: count === 1 
          ? `"${data[0].name}" has been created.`
          : `Created: ${data.map(w => w.name).join(', ')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['event-workspaces', eventId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-hierarchy', eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', parentWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setActiveTab('department');
    setSelectedItems([]);
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open, parentWorkspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSubWorkspacesMutation.mutate();
  };

  const isValid = selectedItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-border/50 bg-card gap-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-primary/10 to-transparent">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Create Sub-Workspaces
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground">
                  Under "{parentWorkspace?.name || 'Workspace'}"
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Tabs */}
          <div className="flex border-b border-border/50">
            <button
              type="button"
              onClick={() => setActiveTab('department')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-all",
                "border-b-2 -mb-px",
                activeTab === 'department'
                  ? "border-blue-500 text-blue-600 bg-blue-500/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              Department
              {selectedDepartments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500 text-white">
                  {selectedDepartments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('committee')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-all",
                "border-b-2 -mb-px",
                activeTab === 'committee'
                  ? "border-amber-500 text-amber-600 bg-amber-500/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Committee
              {selectedCommittees.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white">
                  {selectedCommittees.length}
                </span>
              )}
            </button>
          </div>

          {/* Options List */}
          <div className="px-4 py-3">
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {currentOptions.map((option) => {
                const selected = isSelected(option);
                const colorClass = option.type === 'department' ? 'blue' : 'amber';
                return (
                  <button
                    key={`${option.type}-${option.id}`}
                    type="button"
                    onClick={() => toggleSelection(option)}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all",
                      "border hover:bg-accent/20",
                      selected 
                        ? `border-${colorClass}-500/50 bg-${colorClass}-500/5` 
                        : "border-border/40 bg-background"
                    )}
                  >
                    <div className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors",
                      "border-[1.5px]",
                      selected 
                        ? option.type === 'department' 
                          ? "border-blue-500 bg-blue-500" 
                          : "border-amber-500 bg-amber-500"
                        : "border-muted-foreground/40"
                    )}>
                      {selected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground block truncate">
                        {option.name}
                      </span>
                      {option.description && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedItems.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1">
                {selectedItems.map((item) => (
                  <span
                    key={`${item.type}-${item.id}`}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      item.type === 'department'
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-amber-500/10 text-amber-600"
                    )}
                  >
                    {item.type === 'department' ? <Building2 className="h-2.5 w-2.5" /> : <Users className="h-2.5 w-2.5" />}
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 pb-4 pt-2 border-t border-border/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createSubWorkspacesMutation.isPending}
              className="flex-1 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isValid || createSubWorkspacesMutation.isPending}
              className="flex-1 h-8 text-xs gap-1"
            >
              {createSubWorkspacesMutation.isPending ? (
                <div className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Create {selectedItems.length > 0 && `(${selectedItems.length})`}
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
