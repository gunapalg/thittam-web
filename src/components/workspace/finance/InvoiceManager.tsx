import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Plus, 
  Send,
  
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  paidAmount?: number;
}

interface InvoiceManagerProps {
  workspaceId: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-001',
    vendor: 'Grand Ballroom Venue',
    amount: 25000,
    dueDate: new Date('2025-01-15'),
    status: 'sent',
    paidAmount: 5000,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-002',
    vendor: 'Stellar Catering Co.',
    amount: 18000,
    dueDate: new Date('2025-01-20'),
    status: 'draft',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-003',
    vendor: 'TechSound AV Services',
    amount: 8500,
    dueDate: new Date('2025-01-10'),
    status: 'paid',
    paidAmount: 8500,
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-004',
    vendor: 'PrintMax Graphics',
    amount: 3200,
    dueDate: new Date('2025-01-02'),
    status: 'overdue',
  },
];

export function InvoiceManager({ workspaceId: _workspaceId }: InvoiceManagerProps) {
  const [invoices] = useState<Invoice[]>(mockInvoices);

  const totalOutstanding = invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + (i.amount - (i.paidAmount || 0)), 0);

  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return {
          badge: <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />Paid
          </Badge>,
          color: 'text-emerald-600',
        };
      case 'sent':
        return {
          badge: <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Send className="w-3 h-3 mr-1" />Sent
          </Badge>,
          color: 'text-blue-600',
        };
      case 'draft':
        return {
          badge: <Badge className="bg-muted text-muted-foreground border-border">
            <FileText className="w-3 h-3 mr-1" />Draft
          </Badge>,
          color: 'text-muted-foreground',
        };
      case 'overdue':
        return {
          badge: <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="w-3 h-3 mr-1" />Overdue
          </Badge>,
          color: 'text-destructive',
        };
    }
  };

  const getDaysUntilDue = (dueDate: Date, status: Invoice['status']) => {
    if (status === 'paid') return null;
    const days = differenceInDays(dueDate, new Date());
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    return `${days}d left`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Invoice Manager</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatCurrency(totalOutstanding)} outstanding
                {overdueCount > 0 && (
                  <span className="text-destructive"> · {overdueCount} overdue</span>
                )}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.map(invoice => {
          const statusConfig = getStatusConfig(invoice.status);
          const paidPercentage = invoice.paidAmount 
            ? Math.round((invoice.paidAmount / invoice.amount) * 100) 
            : 0;

          return (
            <div
              key={invoice.id}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{invoice.invoiceNumber}</span>
                    {statusConfig.badge}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{invoice.vendor}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                  <p className={`text-xs ${statusConfig.color}`}>
                    {getDaysUntilDue(invoice.dueDate, invoice.status) || 'Completed'}
                  </p>
                </div>
              </div>
              
              {invoice.status === 'sent' && invoice.paidAmount !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Payment progress</span>
                    <span className="font-medium">{paidPercentage}%</span>
                  </div>
                  <Progress value={paidPercentage} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(invoice.paidAmount)} of {formatCurrency(invoice.amount)} paid
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                {invoice.status === 'draft' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Send className="w-3 h-3" />
                    Send Invoice
                  </Button>
                )}
                {invoice.status === 'overdue' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <AlertTriangle className="w-3 h-3" />
                    Send Reminder
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-auto">
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
