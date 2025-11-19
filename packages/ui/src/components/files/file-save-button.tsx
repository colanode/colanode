import { useNavigate } from '@tanstack/react-router';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { LocalFileNode } from '@colanode/client/types';
import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useApp } from '@colanode/ui/contexts/app';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface FileSaveButtonProps {
  file: LocalFileNode;
}

export const FileSaveButton = ({ file }: FileSaveButtonProps) => {
  const app = useApp();
  const workspace = useWorkspace();
  const mutation = useMutation();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const [isSaving, setIsSaving] = useState(false);

  const handleDownloadDesktop = async () => {
    const path = await window.colanode.showFileSaveDialog({
      name: file.attributes.name,
    });

    if (!path) {
      return;
    }

    mutation.mutate({
      input: {
        type: 'file.download',
        userId: workspace.userId,
        fileId: file.id,
        path,
      },
      onSuccess: () => {
        navigate({
          to: 'downloads',
        });
      },
      onError: () => {
        toast.error('Failed to save file');
      },
    });
  };

  const handleDownloadWeb = async () => {
    setIsSaving(true);

    try {
      const localFile = await window.colanode.executeQuery({
        type: 'local.file.get',
        fileId: file.id,
        userId: workspace.userId,
      });

      if (localFile && localFile.url) {
        // the file is already downloaded locally, so we can just trigger a download
        const link = document.createElement('a');
        link.href = localFile.url;
        link.download = file.attributes.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // the file is not downloaded locally, so we need to download it
      const request = await window.colanode.executeQuery({
        type: 'file.download.request.get',
        id: file.id,
        userId: workspace.userId,
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

      const downloadBlob = await response.blob();
      const downloadBlobUrl = URL.createObjectURL(downloadBlob);

      const link = document.createElement('a');
      link.href = downloadBlobUrl;
      link.download = file.attributes.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (downloadBlobUrl) {
        URL.revokeObjectURL(downloadBlobUrl);
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
      disabled={mutation.isPending || isSaving}
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
