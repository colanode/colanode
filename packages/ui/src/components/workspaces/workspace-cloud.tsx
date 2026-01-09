import { ExternalLink } from 'lucide-react';

import { isColanodeDomain } from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useServer } from '@colanode/ui/contexts/server';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const CLOUD_URL = 'https://cloud.colanode.com';

export const WorkspaceCloud = () => {
  const server = useServer();
  const workspace = useWorkspace();

  if (workspace.role !== 'owner') {
    return null;
  }

  if (!isColanodeDomain(server.domain)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Cloud Plan</h2>
        <Separator className="mt-3" />
      </div>
      <div className="w-full flex flex-row items-center gap-4">
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold">Upgrade your Colanode Cloud plan</h3>
          <p className="text-sm text-muted-foreground">
            Get more storage and higher limits for your workspace.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              window.colanode.openExternalUrl(CLOUD_URL);
            }}
          >
            <ExternalLink className="size-4" />
            <span>Manage Plan</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
