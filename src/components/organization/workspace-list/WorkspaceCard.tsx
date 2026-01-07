import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRightIcon,
  CalendarIcon,
  Squares2X2Icon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { WorkspaceStatus } from '@/types';

export interface WorkspaceItem {
  id: string;
  eventId: string;
  name: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  organizerId: string;
  parentWorkspaceId: string | null;
  isOwner: boolean;
  isMember: boolean;
  event?: {
    id: string;
    name: string;
  };
  subWorkspaces?: WorkspaceItem[];
}

interface WorkspaceCardProps {
  workspace: WorkspaceItem;
  depth?: number;
  index?: number;
  onClick: (workspace: WorkspaceItem) => void;
}

const getStatusStyles = (status: WorkspaceStatus) => {
  switch (status) {
    case WorkspaceStatus.ACTIVE:
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case WorkspaceStatus.PROVISIONING:
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case WorkspaceStatus.WINDING_DOWN:
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case WorkspaceStatus.ARCHIVED:
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  depth = 0,
  index = 0,
  onClick,
}) => {
  const hasSubWorkspaces = workspace.subWorkspaces && workspace.subWorkspaces.length > 0;

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onClick(workspace)}
        className={cn(
          "w-full group relative p-4 sm:p-5 rounded-2xl border border-border/50",
          "bg-card/60 backdrop-blur-md",
          "hover:border-primary/50 hover:bg-card/90",
          "hover:shadow-lg hover:shadow-primary/5",
          "transition-all duration-300 text-left",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        )}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 p-2.5 sm:p-3 rounded-xl",
            "bg-gradient-to-br from-primary/10 to-primary/5",
            "border border-primary/10",
            "group-hover:from-primary/20 group-hover:to-primary/10",
            "transition-all duration-300"
          )}>
            {hasSubWorkspaces ? (
              <FolderOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            ) : (
              <Squares2X2Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-sm sm:text-base">
                {workspace.name}
              </h3>
              {workspace.isOwner && (
                <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full font-medium border border-primary/20">
                  Owner
                </span>
              )}
              {workspace.isMember && !workspace.isOwner && (
                <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full font-medium border border-blue-500/20">
                  Member
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
              {workspace.event && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{workspace.event.name}</span>
                </span>
              )}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border",
                getStatusStyles(workspace.status)
              )}>
                {workspace.status}
              </span>
              <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                Updated {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRightIcon className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </motion.button>

      {/* Sub-workspaces */}
      {hasSubWorkspaces && (
        <div className="mt-2 space-y-2">
          {workspace.subWorkspaces!.map((sub, subIndex) => (
            <WorkspaceCard
              key={sub.id}
              workspace={sub}
              depth={depth + 1}
              index={subIndex}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
