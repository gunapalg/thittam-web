import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  QrCode, 
  Camera,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck,
  Clock,
  Keyboard,
  Volume2,
  VolumeX
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Workspace } from '@/types';

interface ScanCheckInTabProps {
  workspace: Workspace;
}

interface CheckInResult {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  status: 'success' | 'already_checked_in' | 'not_found' | 'cancelled';
  checkInTime: Date;
}

// Mock registered attendees database
const mockRegistrations = [
  { id: 'REG-001', name: 'Priya Sharma', email: 'priya.sharma@email.com', ticketType: 'VIP Pass', status: 'confirmed' },
  { id: 'REG-002', name: 'Rahul Patel', email: 'rahul.p@email.com', ticketType: 'General', status: 'confirmed' },
  { id: 'REG-003', name: 'Anjali Gupta', email: 'anjali.g@email.com', ticketType: 'Student', status: 'checked_in' },
  { id: 'REG-004', name: 'Vikram Singh', email: 'vikram.s@email.com', ticketType: 'General', status: 'cancelled' },
  { id: 'REG-005', name: 'Meera Nair', email: 'meera.n@email.com', ticketType: 'VIP Pass', status: 'confirmed' },
  { id: 'REG-006', name: 'Arjun Kumar', email: 'arjun.k@email.com', ticketType: 'General', status: 'confirmed' },
];

export function ScanCheckInTab({ workspace: _workspace }: ScanCheckInTabProps) {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInResult[]>([]);
  const [stats, setStats] = useState({ today: 0, total: 847, pending: 403 });
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on manual input
  useEffect(() => {
    if (scanMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const playSound = (success: boolean) => {
    if (!soundEnabled) return;
    // In production, use actual audio files
    const audio = new Audio(success ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const processCheckIn = (code: string) => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return;

    // Simulate lookup
    const registration = mockRegistrations.find(
      r => r.id.toUpperCase() === trimmedCode || 
           r.email.toUpperCase() === trimmedCode ||
           r.name.toUpperCase().includes(trimmedCode)
    );

    let result: CheckInResult;

    if (!registration) {
      result = {
        id: trimmedCode,
        name: 'Unknown',
        email: '',
        ticketType: '',
        status: 'not_found',
        checkInTime: new Date(),
      };
      playSound(false);
      toast.error('Registration not found', { description: `Code: ${trimmedCode}` });
    } else if (registration.status === 'checked_in') {
      result = {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        ticketType: registration.ticketType,
        status: 'already_checked_in',
        checkInTime: new Date(),
      };
      playSound(false);
      toast.warning('Already checked in', { description: registration.name });
    } else if (registration.status === 'cancelled') {
      result = {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        ticketType: registration.ticketType,
        status: 'cancelled',
        checkInTime: new Date(),
      };
      playSound(false);
      toast.error('Registration cancelled', { description: registration.name });
    } else {
      result = {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        ticketType: registration.ticketType,
        status: 'success',
        checkInTime: new Date(),
      };
      playSound(true);
      toast.success('Check-in successful!', { description: `${registration.name} - ${registration.ticketType}` });
      setStats(prev => ({ ...prev, today: prev.today + 1, pending: prev.pending - 1 }));
    }

    setRecentCheckIns(prev => [result, ...prev].slice(0, 10));
    setManualCode('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckIn(manualCode);
  };

  const toggleCameraMode = () => {
    if (scanMode === 'camera') {
      setIsScanning(false);
      setScanMode('manual');
    } else {
      setScanMode('camera');
      setIsScanning(true);
      toast.info('Camera scanning ready', { description: 'Point at QR code to scan' });
    }
  };

  const getStatusBadge = (status: CheckInResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>;
      case 'already_checked_in':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="w-3 h-3 mr-1" />Already In</Badge>;
      case 'not_found':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Not Found</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6 text-teal-500" />
            Scan Check-In
          </h2>
          <p className="text-muted-foreground mt-1">Scan QR codes or enter registration IDs to check in attendees</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-9 w-9"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.today}</p>
            <p className="text-sm text-muted-foreground">Checked In Today</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Check-ins</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Scan Interface */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Scan Station</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('manual')}
                className="gap-1.5"
              >
                <Keyboard className="w-4 h-4" />
                Manual
              </Button>
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={toggleCameraMode}
                className="gap-1.5"
              >
                <Camera className="w-4 h-4" />
                Camera
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {scanMode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Enter Registration ID, Email, or Name..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="pl-9 h-12 text-lg"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="h-12 px-6 bg-teal-600 hover:bg-teal-700">
                <UserCheck className="w-5 h-5 mr-2" />
                Check In
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/30">
              <div className={`p-4 rounded-full ${isScanning ? 'bg-teal-500/20 animate-pulse' : 'bg-muted'}`}>
                <Camera className={`w-12 h-12 ${isScanning ? 'text-teal-600' : 'text-muted-foreground'}`} />
              </div>
              <p className="mt-4 text-lg font-medium">
                {isScanning ? 'Camera scanning active...' : 'Camera not available'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isScanning ? 'Point your camera at a QR code' : 'Enable camera access to scan QR codes'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCheckIns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No check-ins yet. Start scanning to see results here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCheckIns.map((checkIn, index) => (
                <div
                  key={`${checkIn.id}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {checkIn.name !== 'Unknown' ? checkIn.name.split(' ').map(n => n[0]).join('') : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{checkIn.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {checkIn.id} {checkIn.ticketType && `· ${checkIn.ticketType}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(checkIn.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(checkIn.checkInTime, 'h:mm:ss a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
