import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, Play, Pause, CheckCircle, AlertTriangle, Plus, Save } from 'lucide-react';

interface UpdateRunsheetTabProps {
  workspaceId: string;
}

interface RunsheetItem {
  id: string;
  time: string;
  duration: string;
  title: string;
  description: string;
  technician: string;
  status: 'upcoming' | 'live' | 'completed' | 'delayed';
  notes: string;
}

const mockRunsheet: RunsheetItem[] = [
  { id: '1', time: '08:00', duration: '30m', title: 'Venue Open / Tech Setup', description: 'Final equipment checks and setup', technician: 'Ahmad', status: 'completed', notes: 'Completed 5 mins early' },
  { id: '2', time: '08:30', duration: '30m', title: 'AV System Warmup', description: 'Power on all AV systems, run diagnostics', technician: 'Sarah', status: 'completed', notes: '' },
  { id: '3', time: '09:00', duration: '15m', title: 'Speaker Mic Check', description: 'Test all wireless mics with speakers', technician: 'Ahmad', status: 'live', notes: 'Currently in progress' },
  { id: '4', time: '09:15', duration: '45m', title: 'Opening Ceremony Support', description: 'Manage lighting and audio cues', technician: 'Wei', status: 'upcoming', notes: '' },
  { id: '5', time: '10:00', duration: '60m', title: 'Keynote Session', description: 'Full AV support, live streaming', technician: 'Sarah', status: 'upcoming', notes: 'Backup laptop ready' },
  { id: '6', time: '11:00', duration: '30m', title: 'Breakout Room Setup', description: 'Configure displays in rooms 101-104', technician: 'Ahmad', status: 'upcoming', notes: '' },
];

export function UpdateRunsheetTab({ workspaceId: _workspaceId }: UpdateRunsheetTabProps) {
  const [runsheet] = useState<RunsheetItem[]>(mockRunsheet);
  const [hasChanges, setHasChanges] = useState(false);

  const getStatusBadge = (status: RunsheetItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>;
      case 'live':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"><Play className="h-3 w-3 mr-1" />Live</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock className="h-3 w-3 mr-1" />Upcoming</Badge>;
      case 'delayed':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Delayed</Badge>;
    }
  };

  const stats = {
    total: runsheet.length,
    completed: runsheet.filter(r => r.status === 'completed').length,
    live: runsheet.filter(r => r.status === 'live').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Update Runsheet</h2>
          <p className="text-sm text-muted-foreground">Manage technical schedule and cue timings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Cue
          </Button>
          <Button disabled={!hasChanges} onClick={() => setHasChanges(false)}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Cues</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.live}</div>
            <div className="text-xs text-muted-foreground">Live Now</div>
          </CardContent>
        </Card>
      </div>

      {/* Runsheet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Technical Runsheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {runsheet.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${
                  item.status === 'live' 
                    ? 'bg-red-500/5 border-red-500/30' 
                    : item.status === 'completed'
                    ? 'bg-muted/30 opacity-60'
                    : 'bg-card hover:bg-muted/30'
                }`}
              >
                <div className="text-center min-w-[60px]">
                  <div className="font-mono font-bold">{item.time}</div>
                  <div className="text-xs text-muted-foreground">{item.duration}</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tech: {item.technician}
                    {item.notes && ` • ${item.notes}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                  {item.status === 'live' && (
                    <Button variant="ghost" size="sm">
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === 'upcoming' && (
                    <Button variant="ghost" size="sm" onClick={() => setHasChanges(true)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
