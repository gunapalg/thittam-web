import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ListOrdered, 
  Search,
  UserPlus,
  Mail,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Ticket
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Workspace } from '@/types';

interface ViewWaitlistTabProps {
  workspace: Workspace;
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ticketType: string;
  position: number;
  joinedAt: Date;
  priority: 'normal' | 'high' | 'vip';
  notes?: string;
  source: 'website' | 'referral' | 'manual';
}

const mockWaitlist: WaitlistEntry[] = [
  { id: '1', name: 'Arun Kumar', email: 'arun.k@email.com', phone: '+91 98765 43210', ticketType: 'General', position: 1, joinedAt: new Date('2025-01-03T14:30:00'), priority: 'high', source: 'website' },
  { id: '2', name: 'Sneha Reddy', email: 'sneha.r@email.com', ticketType: 'VIP Pass', position: 2, joinedAt: new Date('2025-01-03T16:00:00'), priority: 'vip', notes: 'Referred by sponsor', source: 'referral' },
  { id: '3', name: 'Kiran Joshi', email: 'kiran.j@email.com', ticketType: 'General', position: 3, joinedAt: new Date('2025-01-04T09:15:00'), priority: 'normal', source: 'website' },
  { id: '4', name: 'Deepa Menon', email: 'deepa.m@email.com', ticketType: 'Student', position: 4, joinedAt: new Date('2025-01-04T11:45:00'), priority: 'normal', source: 'website' },
  { id: '5', name: 'Rajesh Iyer', email: 'rajesh.i@email.com', ticketType: 'General', position: 5, joinedAt: new Date('2025-01-05T10:00:00'), priority: 'normal', source: 'manual' },
  { id: '6', name: 'Priya Nair', email: 'priya.n@email.com', ticketType: 'VIP Pass', position: 6, joinedAt: new Date('2025-01-05T14:30:00'), priority: 'high', source: 'website' },
  { id: '7', name: 'Amit Shah', email: 'amit.s@email.com', ticketType: 'General', position: 7, joinedAt: new Date('2025-01-06T09:00:00'), priority: 'normal', source: 'website' },
];

const ticketAvailability = [
  { type: 'General', available: 12, waitlisted: 25 },
  { type: 'VIP Pass', available: 3, waitlisted: 8 },
  { type: 'Student', available: 5, waitlisted: 4 },
];

export function ViewWaitlistTab({ workspace: _workspace }: ViewWaitlistTabProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(mockWaitlist);
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const filteredWaitlist = waitlist.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTicket = ticketFilter === 'all' || entry.ticketType === ticketFilter;
    const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
    return matchesSearch && matchesTicket && matchesPriority;
  });

  const handlePromote = (entry: WaitlistEntry) => {
    setWaitlist(prev => prev.filter(e => e.id !== entry.id));
    toast.success('Attendee promoted!', {
      description: `${entry.name} has been moved to confirmed registrations`,
    });
  };

  const handleRemove = (entry: WaitlistEntry) => {
    setWaitlist(prev => prev.filter(e => e.id !== entry.id));
    toast.info('Removed from waitlist', {
      description: `${entry.name} has been removed`,
    });
  };

  const handleMoveUp = (entry: WaitlistEntry) => {
    setWaitlist(prev => {
      const index = prev.findIndex(e => e.id === entry.id);
      if (index <= 0) return prev;
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList.map((e, i) => ({ ...e, position: i + 1 }));
    });
  };

  const handleMoveDown = (entry: WaitlistEntry) => {
    setWaitlist(prev => {
      const index = prev.findIndex(e => e.id === entry.id);
      if (index >= prev.length - 1) return prev;
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList.map((e, i) => ({ ...e, position: i + 1 }));
    });
  };

  const handleBulkPromote = () => {
    const count = selectedEntries.length;
    setWaitlist(prev => prev.filter(e => !selectedEntries.includes(e.id)));
    setSelectedEntries([]);
    toast.success(`${count} attendees promoted!`);
  };

  const handleSendInvites = () => {
    const availableSpots = ticketAvailability.reduce((sum, t) => sum + t.available, 0);
    const toInvite = Math.min(availableSpots, waitlist.length);
    toast.success(`Invitations sent!`, {
      description: `Sent to top ${toInvite} waitlisted attendees`,
    });
  };

  const getPriorityBadge = (priority: WaitlistEntry['priority']) => {
    switch (priority) {
      case 'vip':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">VIP</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Priority</Badge>;
      default:
        return null;
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEntries.length === filteredWaitlist.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredWaitlist.map(e => e.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-cyan-500" />
            Waitlist Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            {waitlist.length} in queue · Manage and promote waitlisted attendees
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-cyan-600">{waitlist.length}</p>
            <p className="text-sm text-muted-foreground">Total Waitlisted</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {ticketAvailability.reduce((sum, t) => sum + t.available, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Spots Available</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-orange-600">
              {waitlist.filter(e => e.priority === 'high' || e.priority === 'vip').length}
            </p>
            <p className="text-sm text-muted-foreground">Priority Entries</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">2.3</p>
            <p className="text-sm text-muted-foreground">Avg Days Waiting</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Waitlist */}
        <div className="lg:col-span-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={ticketFilter} onValueChange={setTicketFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Ticket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="VIP Pass">VIP Pass</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedEntries.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mt-4">
                  <span className="text-sm font-medium">{selectedEntries.length} selected</span>
                  <Button size="sm" onClick={handleBulkPromote} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <UserPlus className="w-3.5 h-3.5" />
                    Promote Selected
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email Selected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedEntries([])}>
                    Clear
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Select All */}
              <div className="flex items-center gap-2 mb-3 px-3">
                <Checkbox
                  checked={selectedEntries.length === filteredWaitlist.length && filteredWaitlist.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>

              {filteredWaitlist.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Waitlist is empty</p>
                  <p className="text-sm">No entries match your filters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredWaitlist.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        selectedEntries.includes(entry.id) ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                        />
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          #{entry.position}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm bg-muted">
                            {entry.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{entry.name}</p>
                            {getPriorityBadge(entry.priority)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{entry.email}</span>
                            <span>·</span>
                            <Badge variant="outline" className="text-[10px]">{entry.ticketType}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Joined {formatDistanceToNow(entry.joinedAt, { addSuffix: true })}</span>
                            {entry.notes && (
                              <>
                                <span>·</span>
                                <span className="italic">{entry.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleMoveUp(entry)} disabled={index === 0}>
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleMoveDown(entry)} disabled={index === filteredWaitlist.length - 1}>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handlePromote(entry)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemove(entry)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Availability */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketAvailability.map(ticket => (
                <div key={ticket.type} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{ticket.type}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={ticket.available > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}>
                      {ticket.available} spots
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSendInvites}>
                <Mail className="w-4 h-4" />
                Send Invites to Available
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <UserPlus className="w-4 h-4" />
                Promote Top Entry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
