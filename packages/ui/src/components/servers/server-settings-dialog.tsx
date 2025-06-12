import { TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ServerDetails } from '@colanode/client/types';
import { formatDate, isColanodeServer, timeAgo } from '@colanode/core';
import { ServerAvatar } from '@colanode/ui/components/servers/server-avatar';
import { Badge } from '@colanode/ui/components/ui/badge';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@colanode/ui/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';
import { cn } from '@colanode/ui/lib/utils';

interface ServerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: ServerDetails;
  onDelete: () => void;
}

export const ServerSettingsDialog = ({
  open,
  onOpenChange,
  server,
  onDelete,
}: ServerSettingsDialogProps) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const canDelete = !isColanodeServer(server.domain);
  const isAvailable = server.state?.isAvailable ?? false;
  const isOutdated = server.isOutdated;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-2xl min-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <ServerAvatar
              url={server.avatar}
              name={server.name}
              className="size-10"
            />
            <div>
              <DialogTitle className="text-left">{server.name}</DialogTitle>
              <DialogDescription className="text-left">
                {server.domain}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Server Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="default"
                      className={cn(
                        'cursor-pointer select-none',
                        isAvailable ? 'bg-emerald-500' : 'bg-destructive'
                      )}
                    >
                      {server.state?.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isAvailable
                      ? 'Server is available to use in this device'
                      : 'Server is unavailable to use. This means the server is not reachable, is outdated or is not allowed to be used from this app.'}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{server.version}</span>
                  {isOutdated && (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="destructive"
                          className="text-xs cursor-pointer select-none"
                        >
                          Outdated
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Server is outdated. Please update the server to the
                        latest version.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SHA</span>
                <span className="text-sm">{server.attributes.sha}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last ping</span>
                <span className="text-sm">
                  {server.state?.lastCheckedAt
                    ? timeAgo(server.state?.lastCheckedAt)
                    : 'Never'}
                </span>
              </div>
              {server.state?.lastCheckedSuccessfullyAt &&
                server.state?.lastCheckedAt &&
                server.state.lastCheckedSuccessfullyAt.getTime() !==
                  server.state.lastCheckedAt.getTime() && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last successful ping
                    </span>
                    <span className="text-sm">
                      {timeAgo(server.state.lastCheckedSuccessfullyAt)}
                    </span>
                  </div>
                )}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Server Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Domain</span>
                <span className="text-sm font-mono">{server.domain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(server.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Config URL
                </span>
                <a
                  href={server.configUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline font-mono break-all"
                >
                  {server.configUrl}
                </a>
              </div>
            </div>
          </div>
        </div>

        {canDelete && (
          <div className="border rounded-lg p-4">
            <h3 className="text-sm mb-3">Delete server from this device</h3>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
              }}
            >
              <TrashIcon className="size-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
