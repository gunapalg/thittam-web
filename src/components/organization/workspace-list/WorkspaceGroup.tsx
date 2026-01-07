import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDownIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { WorkspaceCard, WorkspaceItem } from './WorkspaceCard';

interface WorkspaceGroupProps {
  title: string;
  icon: React.ReactNode;
  workspaces: WorkspaceItem[];
  emptyMessage: string;
  defaultExpanded?: boolean;
  orgSlug?: string;
}

export const WorkspaceGroup: React.FC<WorkspaceGroupProps> = ({
  title,
  icon,
  workspaces,
  emptyMessage,
  defaultExpanded = true,
  orgSlug,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  const handleWorkspaceClick = (workspace: WorkspaceItem) => {
    if (workspace.eventId && orgSlug) {
      navigate(`/${orgSlug}/workspaces/${workspace.eventId}?workspaceId=${workspace.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between px-2 py-3 rounded-xl",
          "hover:bg-muted/50 transition-colors duration-200",
          "group"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            "bg-gradient-to-br from-muted to-muted/50",
            "border border-border/50"
          )}>
            {icon}
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            "bg-muted/80 text-muted-foreground",
            "border border-border/50"
          )}>
            {workspaces.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </motion.div>
      </button>

      {/* Group Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {workspaces.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "py-10 text-center rounded-2xl",
                  "bg-gradient-to-br from-muted/30 to-muted/10",
                  "border border-dashed border-border/60"
                )}
              >
                <div className={cn(
                  "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
                  "bg-muted/50 border border-border/50"
                )}>
                  <FolderIcon className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {workspaces.map((workspace, index) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    index={index}
                    onClick={handleWorkspaceClick}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
