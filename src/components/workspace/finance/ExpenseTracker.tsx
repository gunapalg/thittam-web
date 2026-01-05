import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
}

interface ExpenseTrackerProps {
  workspaceId: string;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Venue deposit payment',
    amount: 5000,
    category: 'Venue',
    submittedBy: 'Sarah Chen',
    submittedAt: new Date('2025-01-03'),
    status: 'approved',
  },
  {
    id: '2',
    description: 'Catering advance - Main event',
    amount: 3500,
    category: 'Catering',
    submittedBy: 'Mike Johnson',
    submittedAt: new Date('2025-01-04'),
    status: 'pending',
  },
  {
    id: '3',
    description: 'Marketing materials printing',
    amount: 850,
    category: 'Marketing',
    submittedBy: 'Emily Davis',
    submittedAt: new Date('2025-01-04'),
    status: 'pending',
  },
  {
    id: '4',
    description: 'Speaker travel reimbursement',
    amount: 1200,
    category: 'Travel',
    submittedBy: 'Alex Wong',
    submittedAt: new Date('2025-01-02'),
    status: 'rejected',
  },
];

const categories = ['All', 'Venue', 'Catering', 'Marketing', 'Travel', 'Equipment', 'Other'];

export function ExpenseTracker({ workspaceId: _workspaceId }: ExpenseTrackerProps) {
  const [expenses] = useState<Expense[]>(mockExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  const getStatusBadge = (status: Expense['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Expense Tracker</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatCurrency(totalPending)} pending · {formatCurrency(totalApproved)} approved
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expense List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No expenses found</p>
            </div>
          ) : (
            filteredExpenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{expense.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{expense.submittedBy}</span>
                      <span>·</span>
                      <span>{expense.category}</span>
                      <span>·</span>
                      <span>{format(expense.submittedAt, 'MMM d')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
                  {getStatusBadge(expense.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
