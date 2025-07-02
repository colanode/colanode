import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { LocalFileNode } from '@colanode/client/types';
import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useApp } from '@colanode/ui/contexts/app';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface FileSaveButtonProps {
  file: LocalFileNode;
}

export const FileSaveButton = ({ file }: FileSaveButtonProps) => {
  const app = useApp();
  const workspace = useWorkspace();
  const mutation = useMutation();
  const layout = useLayout();
  const [isSaving, setIsSaving] = useState(false);

  const fileStateQuery = useQuery({
    type: 'file.state.get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const handleDownloadDesktop = async () => {
    const path = await window.colanode.showFileSaveDialog({
      name: file.attributes.name,
    });

    if (!path) {
      return;
    }

    mutation.mutate({
      input: {
        type: 'file.save',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        fileId: file.id,
        path,
      },
      onSuccess: () => {
        layout.open('downloads');
      },
      onError: () => {
        toast.error('Failed to save file');
      },
    });
  };

  const handleDownloadWeb = async () => {
    if (fileStateQuery.isPending) {
      return;
    }

    setIsSaving(true);

    try {
      const url = fileStateQuery.data?.url;
      if (url) {
        // the file is already downloaded locally, so we can just trigger a download
        const link = document.createElement('a');
        link.href = url;
        link.download = file.attributes.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // the file is not downloaded locally, so we need to download it
        const request = await window.colanode.executeQuery({
          type: 'file.download.request.get',
          id: file.id,
          accountId: workspace.accountId,
          workspaceId: workspace.id,
        });

        if (!request) {
          toast.error('Failed to save file');
          return;
        }

        const response = await fetch(request.url, {
          method: 'GET',
          headers: request.headers,
        });

        if (!response.ok) {
          toast.error('Failed to save file');
          return;
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.attributes.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      }
    } catch {
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (app.type === 'desktop') {
      handleDownloadDesktop();
    } else if (app.type === 'web') {
      handleDownloadWeb();
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={fileStateQuery.isPending || isSaving}
    >
      {isSaving ? (
        <Spinner className="size-4" />
      ) : (
        <Download className="size-4" />
      )}
      Save
    </Button>
  );
};
