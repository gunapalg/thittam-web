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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceType, WorkspaceRole } from '@/types';
import {
  MAX_WORKSPACE_DEPTH,
  getWorkspaceTypeLabel,
  getCreationOptions,
  canHaveChildren,
  getResponsibleRoleForWorkspace,
  getWorkspaceRoleLabel,
} from '@/lib/workspaceHierarchy';
import { 
  AlertTriangle, 
  Building2, 
  Users, 
  Layers, 
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateSubWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentWorkspaceId: string;
  eventId: string;
}

export function CreateSubWorkspaceModal({
  open,
  onOpenChange,
  parentWorkspaceId,
  eventId,
}: CreateSubWorkspaceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customName, setCustomName] = useState('');

  // Fetch parent workspace to get its type and department_id
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

  // Get parent workspace type with fallback for legacy data
  const parentType = useMemo(() => {
    if (!parentWorkspace) return undefined;
    if (parentWorkspace.workspace_type) {
      return parentWorkspace.workspace_type as WorkspaceType;
    }
    return parentWorkspace.parent_workspace_id ? undefined : WorkspaceType.ROOT;
  }, [parentWorkspace]);

  // Get creation options based on parent type
  const creationInfo = useMemo(() => {
    return getCreationOptions(parentType, parentWorkspace?.department_id || undefined);
  }, [parentType, parentWorkspace?.department_id]);

  const nextType = creationInfo.nextType;
  const options = creationInfo.options;
  const allowCustomName = creationInfo.allowCustomName;

  // Check if creation is allowed
  const canCreate = nextType !== null && canHaveChildren(parentType);

  // Determine final name based on selection
  const getFinalName = (): string => {
    if (allowCustomName) {
      return customName;
    }
    if (options && selectedOption) {
      const option = options.find(o => o.id === selectedOption);
      return option?.name || '';
    }
    return '';
  };

  // Get department_id for the new workspace
  const getDepartmentId = (): string | null => {
    if (nextType === WorkspaceType.DEPARTMENT) {
      return selectedOption || null;
    }
    return parentWorkspace?.department_id || null;
  };

  // Get the responsible role for the workspace being created
  const responsibleRole = useMemo((): WorkspaceRole | null => {
    if (!nextType) return null;
    
    const departmentId = nextType === WorkspaceType.DEPARTMENT 
      ? selectedOption 
      : parentWorkspace?.department_id || undefined;
    
    const committeeId = nextType === WorkspaceType.COMMITTEE 
      ? selectedOption 
      : undefined;
    
    return getResponsibleRoleForWorkspace(nextType, departmentId, committeeId);
  }, [nextType, selectedOption, parentWorkspace?.department_id]);

  const createSubWorkspaceMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be authenticated');
      if (!canCreate) throw new Error('Cannot create sub-workspace at this level');

      const name = getFinalName();
      if (!name.trim()) throw new Error('Name is required');

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          event_id: eventId,
          parent_workspace_id: parentWorkspaceId,
          organizer_id: user.id,
          status: 'ACTIVE',
          workspace_type: nextType,
          department_id: getDepartmentId(),
        })
        .select('id, name')
        .single();

      if (wsError) throw wsError;

      if (responsibleRole) {
        const { error: memberError } = await supabase
          .from('workspace_team_members')
          .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: responsibleRole,
            status: 'active',
          });

        if (memberError) {
          console.error('Failed to auto-assign role:', memberError);
        }
      }

      return { ...workspace, assignedRole: responsibleRole };
    },
    onSuccess: (data) => {
      const roleMessage = data.assignedRole 
        ? ` You've been assigned as ${getWorkspaceRoleLabel(data.assignedRole)}.`
        : '';
      
      toast({
        title: `${getWorkspaceTypeLabel(nextType || undefined)} created`,
        description: `"${data.name}" has been created successfully.${roleMessage}`,
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
    setSelectedOption('');
    setCustomName('');
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, parentWorkspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSubWorkspaceMutation.mutate();
  };

  const isValid = allowCustomName ? customName.trim().length > 0 : selectedOption.length > 0;

  // Get styling for workspace type
  const getTypeStyles = () => {
    switch (nextType) {
      case WorkspaceType.DEPARTMENT:
        return { 
          icon: Building2, 
          gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
          border: 'border-blue-500/30',
          iconColor: 'text-blue-500',
          ring: 'ring-blue-500/20'
        };
      case WorkspaceType.COMMITTEE:
        return { 
          icon: Users, 
          gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
          border: 'border-amber-500/30',
          iconColor: 'text-amber-500',
          ring: 'ring-amber-500/20'
        };
      case WorkspaceType.TEAM:
        return { 
          icon: Layers, 
          gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
          border: 'border-emerald-500/30',
          iconColor: 'text-emerald-500',
          ring: 'ring-emerald-500/20'
        };
      default:
        return { 
          icon: Sparkles, 
          gradient: 'from-primary/20 via-primary/10 to-transparent',
          border: 'border-primary/30',
          iconColor: 'text-primary',
          ring: 'ring-primary/20'
        };
    }
  };

  const styles = getTypeStyles();
  const TypeIcon = styles.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-border/50 bg-card">
        {/* Header with gradient */}
        <div className={cn(
          "relative px-6 pt-8 pb-6 bg-gradient-to-b",
          styles.gradient
        )}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background/0 to-background pointer-events-none" />
          
          <DialogHeader className="relative space-y-3">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              "bg-background border shadow-lg",
              styles.border
            )}>
              <TypeIcon className={cn("h-7 w-7", styles.iconColor)} />
            </div>
            
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                Create Sub-Workspace
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                {canCreate 
                  ? `Add a new ${getWorkspaceTypeLabel(nextType || undefined).toLowerCase()} under "${parentWorkspace?.name || 'Workspace'}"`
                  : 'This workspace has reached its maximum depth.'}
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        {!canCreate ? (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-foreground">Maximum Depth Reached</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Teams are the final level. You cannot create sub-workspaces beyond level {MAX_WORKSPACE_DEPTH}.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
            {/* Hierarchy breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-muted/50">
                {parentWorkspace?.name || 'Parent'}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className={cn(
                "px-2 py-1 rounded-md border-2 border-dashed",
                styles.border,
                styles.iconColor
              )}>
                New {getWorkspaceTypeLabel(nextType || undefined)}
              </span>
            </div>

            {/* Input Section */}
            {allowCustomName ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Workspace Name
                </label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter a name for your workspace..."
                  maxLength={100}
                  autoFocus
                  className={cn(
                    "h-12 text-base transition-all duration-200",
                    "focus-visible:ring-2",
                    styles.ring
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name (e.g., "Stage Setup", "Vendor Coordination")
                </p>
              </div>
            ) : options && options.length > 0 ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Select Type
                </label>
                <div className="grid gap-2">
                  {options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedOption(option.id)}
                        className={cn(
                          "relative flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200",
                          "border-2 hover:border-primary/50 hover:bg-accent/50",
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-border bg-background"
                        )}
                      >
                        <div className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isSelected 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <span className={cn(
                            "font-medium",
                            isSelected ? "text-foreground" : "text-foreground/80"
                          )}>
                            {option.name}
                          </span>
                          {option.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No options available for this level.
              </div>
            )}

            {/* Role assignment preview */}
            {responsibleRole && isValid && (
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                "bg-gradient-to-r from-primary/5 to-transparent",
                "border border-primary/20"
              )}>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    You'll be the {getWorkspaceRoleLabel(responsibleRole)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Automatically assigned as the creator
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createSubWorkspaceMutation.isPending}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || createSubWorkspaceMutation.isPending}
                className={cn(
                  "flex-1 h-11 gap-2",
                  "bg-primary hover:bg-primary/90"
                )}
              >
                {createSubWorkspaceMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
