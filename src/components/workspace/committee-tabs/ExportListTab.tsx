import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Workspace } from '@/types';

interface ExportListTabProps {
  workspace: Workspace;
}

interface ExportHistory {
  id: string;
  filename: string;
  format: string;
  records: number;
  createdAt: Date;
  status: 'completed' | 'processing';
}

const exportFormats = [
  { id: 'csv', name: 'CSV', icon: FileSpreadsheet, description: 'Excel compatible spreadsheet' },
  { id: 'xlsx', name: 'Excel', icon: FileSpreadsheet, description: 'Native Excel format' },
  { id: 'pdf', name: 'PDF', icon: FileText, description: 'Printable document' },
  { id: 'json', name: 'JSON', icon: FileJson, description: 'Developer-friendly format' },
];

const dataFields = [
  { id: 'name', label: 'Full Name', required: true },
  { id: 'email', label: 'Email Address', required: true },
  { id: 'phone', label: 'Phone Number', required: false },
  { id: 'ticketType', label: 'Ticket Type', required: false },
  { id: 'registrationDate', label: 'Registration Date', required: false },
  { id: 'status', label: 'Status', required: false },
  { id: 'checkInTime', label: 'Check-in Time', required: false },
  { id: 'customFields', label: 'Custom Fields', required: false },
  { id: 'notes', label: 'Notes', required: false },
];

const mockExportHistory: ExportHistory[] = [
  { id: '1', filename: 'attendees_2025-01-10.csv', format: 'CSV', records: 1250, createdAt: new Date('2025-01-10T14:30:00'), status: 'completed' },
  { id: '2', filename: 'vip_attendees.xlsx', format: 'Excel', records: 156, createdAt: new Date('2025-01-09T09:15:00'), status: 'completed' },
  { id: '3', filename: 'checkin_report.pdf', format: 'PDF', records: 847, createdAt: new Date('2025-01-08T16:45:00'), status: 'completed' },
];

export function ExportListTab({ workspace: _workspace }: ExportListTabProps) {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>(['name', 'email', 'ticketType', 'status']);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>(mockExportHistory);

  const toggleField = (fieldId: string) => {
    const field = dataFields.find(f => f.id === fieldId);
    if (field?.required) return;
    
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportProgress(i);
    }

    const formatInfo = exportFormats.find(f => f.id === selectedFormat);
    const filename = `attendees_${format(new Date(), 'yyyy-MM-dd')}.${selectedFormat}`;
    
    const newExport: ExportHistory = {
      id: Date.now().toString(),
      filename,
      format: formatInfo?.name || selectedFormat.toUpperCase(),
      records: 1250,
      createdAt: new Date(),
      status: 'completed',
    };

    setExportHistory(prev => [newExport, ...prev]);
    setIsExporting(false);
    setExportProgress(0);

    toast.success('Export completed!', {
      description: `${filename} is ready for download`,
      action: {
        label: 'Download',
        onClick: () => {
          // Trigger download
          toast.info('Download started');
        },
      },
    });
  };

  const getFormatIcon = (formatId: string) => {
    const format = exportFormats.find(f => f.id === formatId.toLowerCase());
    return format?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Download className="w-6 h-6 text-purple-500" />
          Export Attendee List
        </h2>
        <p className="text-muted-foreground mt-1">Download registration data in various formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Format</CardTitle>
              <CardDescription>Choose the file format for your export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {exportFormats.map(format => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedFormat === format.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${selectedFormat === format.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="font-medium">{format.name}</p>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Data Fields</CardTitle>
              <CardDescription>Select which fields to include in the export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dataFields.map(field => (
                  <div
                    key={field.id}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedFields.includes(field.id) ? 'bg-primary/5 border-primary/30' : 'border-border'
                    }`}
                  >
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                      disabled={field.required}
                    />
                    <Label htmlFor={field.id} className="flex-1 cursor-pointer text-sm">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              <CardDescription>Filter which records to include</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="confirmed">Confirmed Only</SelectItem>
                      <SelectItem value="checked_in">Checked In Only</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="cancelled">Cancelled Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <Select value={ticketFilter} onValueChange={setTicketFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="vip">VIP Pass</SelectItem>
                      <SelectItem value="general">General Admission</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="speaker">Speaker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              {isExporting ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Exporting...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              ) : (
                <Button onClick={handleExport} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Export {selectedFields.length} Fields as {exportFormats.find(f => f.id === selectedFormat)?.name}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Export Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Total Records</span>
                </div>
                <Badge>1,250</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Confirmed</span>
                </div>
                <span className="text-sm">847</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Pending</span>
                </div>
                <span className="text-sm">403</span>
              </div>
            </CardContent>
          </Card>

          {/* Export History */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exportHistory.map(exp => {
                const Icon = getFormatIcon(exp.format);
                return (
                  <div key={exp.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exp.filename}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{exp.records.toLocaleString()} records</span>
                          <span>·</span>
                          <span>{format(exp.createdAt, 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
