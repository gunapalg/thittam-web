import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Rocket, Shield, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface WorkspacePublishSettingsProps {
  workspaceId: string;
}

const MANAGER_ROLES = [
  { id: 'WORKSPACE_OWNER', label: 'Workspace Owner' },
  { id: 'OPERATIONS_MANAGER', label: 'Operations Manager' },
  { id: 'GROWTH_MANAGER', label: 'Growth Manager' },
  { id: 'TECH_FINANCE_MANAGER', label: 'Tech & Finance Manager' },
];

export function WorkspacePublishSettings({ workspaceId }: WorkspacePublishSettingsProps) {
  const queryClient = useQueryClient();
  
  // Fetch current workspace settings
  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace-settings', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, settings, workspace_type')
        .eq('id', workspaceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const settings = (workspace?.settings as {
    requireEventPublishApproval?: boolean;
    publishApprovalRoles?: string[];
  }) || {};

  const [requireApproval, setRequireApproval] = useState(settings.requireEventPublishApproval ?? false);
  const [approvalRoles, setApprovalRoles] = useState<string[]>(
    settings.publishApprovalRoles || ['WORKSPACE_OWNER']
  );

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const newSettings = {
        ...settings,
        requireEventPublishApproval: requireApproval,
        publishApprovalRoles: approvalRoles,
      };

      const { error } = await supabase
        .from('workspaces')
        .update({ settings: newSettings })
        .eq('id', workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Publishing settings updated');
      queryClient.invalidateQueries({ queryKey: ['workspace-settings', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setApprovalRoles([...approvalRoles, roleId]);
    } else {
      // Ensure at least one role is always selected
      if (approvalRoles.length > 1) {
        setApprovalRoles(approvalRoles.filter(r => r !== roleId));
      }
    }
  };

  const hasChanges = 
    requireApproval !== (settings.requireEventPublishApproval ?? false) ||
    JSON.stringify(approvalRoles.sort()) !== JSON.stringify((settings.publishApprovalRoles || ['WORKSPACE_OWNER']).sort());

  // Only show for ROOT workspaces
  if (workspace && workspace.workspace_type !== 'ROOT') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-5 w-5 text-primary" />
          Event Publishing Settings
        </CardTitle>
        <CardDescription>
          Control how events are published from this workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Require Approval Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="require-approval" className="font-medium">
                Require approval before publishing
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, event publish requests will be reviewed by managers before going live
            </p>
          </div>
          <Switch
            id="require-approval"
            checked={requireApproval}
            onCheckedChange={setRequireApproval}
          />
        </div>

        {/* Approver Roles Selection */}
        {requireApproval && (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Approver Roles</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Select which roles can approve event publish requests
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {MANAGER_ROLES.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.id}
                    checked={approvalRoles.includes(role.id)}
                    onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                    disabled={approvalRoles.length === 1 && approvalRoles.includes(role.id)}
                  />
                  <label
                    htmlFor={role.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
