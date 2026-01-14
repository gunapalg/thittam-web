import { useState } from 'react';
import { useEventPublishApprovals, type EventPublishApprovalItem } from '@/hooks/useEventPublishApprovals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Rocket, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2,
  FileText,
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventPublishApprovalListProps {
  workspaceId: string;
}

export function EventPublishApprovalList({ workspaceId }: EventPublishApprovalListProps) {
  const { 
    pendingRequests, 
    isLoading, 
    approveRequest, 
    rejectRequest,
    isApproving,
    isRejecting 
  } = useEventPublishApprovals(workspaceId);

  const [selectedRequest, setSelectedRequest] = useState<EventPublishApprovalItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === 'approve') {
        await approveRequest({ 
          requestId: selectedRequest.id, 
          eventId: selectedRequest.eventId,
          notes: notes || undefined 
        });
      } else {
        await rejectRequest({ 
          requestId: selectedRequest.id, 
          notes 
        });
      }
      setSelectedRequest(null);
      setActionType(null);
      setNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      high: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
      urgent: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    return styles[priority] || styles.medium;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Rocket className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No pending event publish requests</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {pendingRequests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">
                    {request.eventName}
                  </CardTitle>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                  getPriorityStyle(request.priority)
                )}>
                  {request.priority}
                </span>
              </div>
              <CardDescription className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {request.requesterName || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(request.requestedAt), 'MMM d, yyyy')}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionType('approve');
                  }}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionType('reject');
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
                {request.checklistSnapshot && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 ml-auto"
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType(null);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View Checklist
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Dialog */}
      <Dialog 
        open={!!selectedRequest && !!actionType} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setActionType(null);
            setNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Approve Publish Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Reject Publish Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `Approve and publish "${selectedRequest?.eventName}"?`
                : `Reject publish request for "${selectedRequest?.eventName}"?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'reject' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Please provide feedback to help the requester understand why this was rejected.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason'}
              </label>
              <Textarea
                placeholder={actionType === 'approve' 
                  ? 'Add any notes for the requester...'
                  : 'Explain why this request was rejected...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={isApproving || isRejecting || (actionType === 'reject' && !notes.trim())}
            >
              {(isApproving || isRejecting) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {actionType === 'approve' ? 'Approve & Publish' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist View Dialog */}
      <Dialog 
        open={!!selectedRequest && !actionType} 
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pre-Publish Checklist</DialogTitle>
            <DialogDescription>
              Checklist snapshot for "{selectedRequest?.eventName}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedRequest?.checklistSnapshot?.items ? (
              <div className="space-y-2">
                {(selectedRequest.checklistSnapshot.items as any[]).map((item: any, index: number) => (
                  <div 
                    key={index}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg text-sm',
                      item.status === 'pass' && 'bg-green-500/10',
                      item.status === 'warning' && 'bg-yellow-500/10',
                      item.status === 'fail' && 'bg-red-500/10',
                    )}
                  >
                    {item.status === 'pass' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {item.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {item.status === 'fail' && <XCircle className="h-4 w-4 text-red-500" />}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No checklist data available</p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
