import { Cloud, ExternalLink } from 'lucide-react';

import { isColanodeDomain } from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import { useServer } from '@colanode/ui/contexts/server';

const CLOUD_URL = 'https://cloud.colanode.com';

export const WorkspaceStorageCloud = () => {
  const server = useServer();
  if (!isColanodeDomain(server.domain)) {
    return null;
  }

  return (
    <div className="w-full flex flex-row items-center border border-muted rounded-lg p-4 gap-4">
      <Cloud className="size-6" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold tracking-tight">
          Upgrade your Colanode Cloud plan
        </h3>
        <p className="text-sm text-muted-foreground">
          Get more storage and higher limits for your workspace.
        </p>
      </div>
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
  );
};
