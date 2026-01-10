import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Settings, CheckCircle, Clock, User, Play } from 'lucide-react';

interface TechCheckTabProps {
  workspaceId: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  assignee: string;
  notes: string;
}

const mockChecklist: ChecklistSection[] = [
  {
    id: 'audio',
    title: 'Audio Systems',
    items: [
      { id: 'a1', label: 'Test main speakers', checked: true, assignee: 'Ahmad', notes: '' },
      { id: 'a2', label: 'Check all wireless mic batteries', checked: true, assignee: 'Ahmad', notes: 'Batteries replaced' },
      { id: 'a3', label: 'Verify mixer levels', checked: false, assignee: 'Sarah', notes: '' },
      { id: 'a4', label: 'Test backup audio system', checked: false, assignee: 'Sarah', notes: '' },
    ],
  },
  {
    id: 'visual',
    title: 'Visual Systems',
    items: [
      { id: 'v1', label: 'Projector alignment check', checked: true, assignee: 'Wei', notes: '' },
      { id: 'v2', label: 'LED wall calibration', checked: true, assignee: 'Wei', notes: '' },
      { id: 'v3', label: 'Screen test patterns', checked: false, assignee: 'Wei', notes: '' },
      { id: 'v4', label: 'Laptop connectivity test', checked: false, assignee: 'Ahmad', notes: '' },
    ],
  },
  {
    id: 'network',
    title: 'Network & Streaming',
    items: [
      { id: 'n1', label: 'WiFi speed test', checked: true, assignee: 'Sarah', notes: '200 Mbps confirmed' },
      { id: 'n2', label: 'Streaming encoder test', checked: false, assignee: 'Sarah', notes: '' },
      { id: 'n3', label: 'Backup internet connection', checked: false, assignee: 'Ahmad', notes: '' },
    ],
  },
  {
    id: 'lighting',
    title: 'Lighting',
    items: [
      { id: 'l1', label: 'Stage lighting preset test', checked: false, assignee: 'Wei', notes: '' },
      { id: 'l2', label: 'House lights control', checked: false, assignee: 'Wei', notes: '' },
      { id: 'l3', label: 'Emergency lighting check', checked: true, assignee: 'Ahmad', notes: '' },
    ],
  },
];

export function TechCheckTab({ workspaceId: _workspaceId }: TechCheckTabProps) {
  const [checklist, setChecklist] = useState<ChecklistSection[]>(mockChecklist);

  const totalItems = checklist.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = checklist.reduce((acc, section) => 
    acc + section.items.filter(item => item.checked).length, 0);
  const progress = Math.round((completedItems / totalItems) * 100);

  const toggleItem = (sectionId: string, itemId: string) => {
    setChecklist(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map(item => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      };
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tech Check</h2>
          <p className="text-sm text-muted-foreground">Pre-event technical verification checklist</p>
        </div>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          Run Full Check
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{completedItems}/{totalItems} items</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center gap-4 mt-3">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />{completedItems} Complete
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              <Clock className="h-3 w-3 mr-1" />{totalItems - completedItems} Remaining
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      <div className="grid gap-4">
        {checklist.map((section) => {
          const sectionComplete = section.items.filter(i => i.checked).length;
          const sectionTotal = section.items.length;
          
          return (
            <Card key={section.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {section.title}
                  </CardTitle>
                  <Badge variant="outline">{sectionComplete}/{sectionTotal}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                        item.checked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card hover:bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(section.id, item.id)}
                      />
                      <span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {item.assignee}
                      </div>
                      {item.notes && (
                        <span className="text-xs text-muted-foreground">{item.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
