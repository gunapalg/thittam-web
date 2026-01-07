import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { cn } from '@/lib/utils';

interface WorkspaceListHeaderProps {
  organizationName?: string;
  orgSlug?: string;
  totalCount: number;
  canManageWorkspaces: boolean;
}

export const WorkspaceListHeader: React.FC<WorkspaceListHeaderProps> = ({
  organizationName,
  orgSlug,
  totalCount,
  canManageWorkspaces,
}) => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <OrganizationBreadcrumbs
        items={[
          {
            label: organizationName ?? 'Organization',
            href: orgSlug ? `/${orgSlug}` : undefined,
          },
          {
            label: 'Workspaces',
            isCurrent: true,
          },
        ]}
        className="text-xs"
      />

      {/* Hero Section */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-card via-card to-muted/30",
        "border border-border/50",
        "p-6 sm:p-8"
      )}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-xl",
              "bg-gradient-to-br from-primary/20 to-primary/10",
              "border border-primary/20"
            )}>
              <Squares2X2Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Workspaces
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">{totalCount}</span> workspaces across all events
              </p>
            </div>
          </div>

          {canManageWorkspaces && (
            <Link to={`/${orgSlug}/workspaces/create`}>
              <Button 
                size="default" 
                className={cn(
                  "gap-2 shadow-lg shadow-primary/20",
                  "hover:shadow-xl hover:shadow-primary/30",
                  "transition-all duration-300"
                )}
              >
                <PlusIcon className="h-4 w-4" />
                <span>New Workspace</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};
