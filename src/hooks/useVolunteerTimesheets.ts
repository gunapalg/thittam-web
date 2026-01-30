import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface VolunteerTimesheet {
  id: string;
  eventId: string;
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  shiftId: string | null;
  shiftName: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  hoursLogged: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface ApproveTimesheetInput {
  timesheetId: string;
  approved: boolean;
  notes?: string;
}

/**
 * Hook for managing volunteer timesheets and approvals
 * 
 * Note: This hook is ready for backend integration. Currently returns empty data
 * until the volunteer_time_logs table and RPC functions are created.
 * 
 * Required database setup:
 * - volunteer_time_logs table with columns:
 *   id, event_id, volunteer_id, shift_id, check_in_time, check_out_time,
 *   hours_logged, status, approved_by, approved_at, notes, created_at
 */
export function useVolunteerTimesheets(workspaceId: string, _eventId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['volunteer-timesheets', workspaceId];

  // Fetch timesheets - currently returns empty until table is created
  const {
    data: timesheets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<VolunteerTimesheet[]> => {
      // TODO: Implement once volunteer_time_logs table is created
      // For now, return empty array - no mock data
      return [];
    },
    enabled: !!workspaceId,
  });

  // Approve/reject timesheet mutation
  const processTimesheet = useMutation({
    mutationFn: async ({ timesheetId, approved, notes: _notes }: ApproveTimesheetInput) => {
      // TODO: Implement once table is created
      console.log(`Processing timesheet ${timesheetId}: ${approved ? 'approved' : 'rejected'}`);
      throw new Error('Timesheet processing not yet implemented');
    },
    onMutate: async ({ timesheetId, approved }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<VolunteerTimesheet[]>(queryKey);

      queryClient.setQueryData(
        queryKey,
        previous?.map((t) =>
          t.id === timesheetId
            ? {
                ...t,
                status: approved ? ('approved' as const) : ('rejected' as const),
                approvedAt: new Date().toISOString(),
              }
            : t
        )
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: 'Failed to process timesheet',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (_, { approved }) => {
      toast({
        title: approved ? 'Timesheet approved' : 'Timesheet rejected',
      });
    },
  });

  // Bulk approve timesheets
  const bulkApprove = useMutation({
    mutationFn: async (timesheetIds: string[]) => {
      // TODO: Implement once table is created
      console.log(`Bulk approving ${timesheetIds.length} timesheets`);
      throw new Error('Bulk approval not yet implemented');
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: `${ids.length} timesheets approved` });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to approve timesheets',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter helpers
  const pendingTimesheets = timesheets.filter((t) => t.status === 'pending');
  const approvedTimesheets = timesheets.filter((t) => t.status === 'approved');
  const rejectedTimesheets = timesheets.filter((t) => t.status === 'rejected');

  // Calculate total hours
  const totalHours = timesheets.reduce((sum, t) => sum + t.hoursLogged, 0);
  const approvedHours = approvedTimesheets.reduce((sum, t) => sum + t.hoursLogged, 0);
  const pendingHours = pendingTimesheets.reduce((sum, t) => sum + t.hoursLogged, 0);

  return {
    timesheets,
    isLoading,
    error,
    processTimesheet,
    bulkApprove,
    // Filtered lists
    pendingTimesheets,
    approvedTimesheets,
    rejectedTimesheets,
    // Stats
    stats: {
      total: timesheets.length,
      pending: pendingTimesheets.length,
      approved: approvedTimesheets.length,
      rejected: rejectedTimesheets.length,
      totalHours,
      approvedHours,
      pendingHours,
    },
  };
}
