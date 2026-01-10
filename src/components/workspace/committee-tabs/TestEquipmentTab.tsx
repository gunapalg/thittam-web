import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Monitor, CheckCircle, XCircle, AlertTriangle, Search, Play, RotateCcw } from 'lucide-react';

interface TestEquipmentTabProps {
  workspaceId: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'passed' | 'failed' | 'pending' | 'testing';
  lastTested: string | null;
  notes: string;
}

const mockEquipment: Equipment[] = [
  { id: '1', name: 'Main Stage Projector', type: 'Projector', location: 'Main Hall', status: 'passed', lastTested: '2026-01-10 09:30', notes: 'All tests passed' },
  { id: '2', name: 'Wireless Mic Set A', type: 'Audio', location: 'Main Hall', status: 'passed', lastTested: '2026-01-10 09:15', notes: 'Battery replaced' },
  { id: '3', name: 'Breakout Room Display 1', type: 'Display', location: 'Room 101', status: 'failed', lastTested: '2026-01-10 08:45', notes: 'HDMI port not responding' },
  { id: '4', name: 'Laptop Station 1', type: 'Computer', location: 'Registration', status: 'pending', lastTested: null, notes: '' },
  { id: '5', name: 'PA System', type: 'Audio', location: 'Main Hall', status: 'testing', lastTested: null, notes: 'Currently running diagnostics' },
  { id: '6', name: 'LED Wall Controller', type: 'Display', location: 'Main Hall', status: 'passed', lastTested: '2026-01-10 10:00', notes: 'Firmware updated' },
];

export function TestEquipmentTab({ workspaceId: _workspaceId }: TestEquipmentTabProps) {
  const [equipment] = useState<Equipment[]>(mockEquipment);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: equipment.length,
    passed: equipment.filter(e => e.status === 'passed').length,
    failed: equipment.filter(e => e.status === 'failed').length,
    pending: equipment.filter(e => e.status === 'pending').length,
  };

  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'testing':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><RotateCcw className="h-3 w-3 mr-1 animate-spin" />Testing</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Test Equipment</h2>
          <p className="text-sm text-muted-foreground">Run diagnostics and verify equipment status</p>
        </div>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          Run All Tests
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Equipment</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">{stats.passed}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'passed', 'failed', 'pending', 'testing'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Equipment Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEquipment.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.type} • {item.location}
                    {item.lastTested && ` • Last tested: ${item.lastTested}`}
                  </div>
                  {item.notes && (
                    <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(item.status)}
                  <Button variant="ghost" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
