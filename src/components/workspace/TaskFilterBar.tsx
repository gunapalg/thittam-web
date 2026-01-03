import { TaskStatus, TeamMember } from '../../types';
import { Search, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';

export type TaskSortKey = 'dueDate' | 'createdAt';
export type TaskSortDirection = 'asc' | 'desc';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'ALL';
  assigneeId: string | 'ALL';
  sortKey: TaskSortKey;
  sortDirection: TaskSortDirection;
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onChange: (next: Partial<TaskFilters>) => void;
  teamMembers: TeamMember[];
}

export function TaskFilterBar({ filters, onChange, teamMembers }: TaskFilterBarProps) {
  const handleInputChange = (key: keyof TaskFilters, value: string) => {
    onChange({ [key]: value } as Partial<TaskFilters>);
  };

  const toggleSortDirection = () => {
    onChange({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' });
  };

  const hasActiveFilters = filters.search || filters.status !== 'ALL' || filters.assigneeId !== 'ALL';

  const clearFilters = () => {
    onChange({
      search: '',
      status: 'ALL',
      assigneeId: 'ALL',
    });
  };

  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Main Filter Row */}
      <div className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-0 lg:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Search tasks..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <select
              value={filters.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[120px]"
            >
              <option value="ALL">All statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <select
            value={filters.assigneeId}
            onChange={(e) => handleInputChange('assigneeId', e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[130px]"
          >
            <option value="ALL">All assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.userId}>
                {member.user?.name || 'Member'}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <select
              value={filters.sortKey}
              onChange={(e) => handleInputChange('sortKey', e.target.value as TaskSortKey)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[110px]"
            >
              <option value="dueDate">Due date</option>
              <option value="createdAt">Created</option>
            </select>
            <button
              type="button"
              onClick={toggleSortDirection}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              aria-label="Toggle sort direction"
            >
              {filters.sortDirection === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-9 px-3 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
