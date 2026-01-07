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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Compact Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between px-2 py-2 rounded-lg",
          "hover:bg-muted/40 transition-colors duration-150",
          "group"
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-semibold text-foreground">{title}</h2>
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            "bg-muted/70 text-muted-foreground"
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
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {workspaces.length === 0 ? (
              <div className={cn(
                "py-6 text-center rounded-lg",
                "bg-muted/20 border border-dashed border-border/50"
              )}>
                <FolderIcon className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{emptyMessage}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
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
