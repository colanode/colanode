import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { Spinner } from '@/renderer/components/ui/spinner';
import { Download } from 'lucide-react';

interface FileDownloadProps {
  id: string;
  downloadProgress: number | null | undefined;
}

export const FileDownload = ({ id, downloadProgress }: FileDownloadProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const isDownloading = typeof downloadProgress === 'number';
  return (
    <div className="flex h-full w-full items-center justify-center">
      {isDownloading ? (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="size-8" />
          <p className="text-sm">Downloading file...</p>
        </div>
      ) : (
        <div
          className="flex cursor-pointer flex-col items-center gap-3 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            mutate({
              input: {
                type: 'file_download',
                userId: workspace.userId,
                fileId: id,
              },
            });
          }}
        >
          <Download className="size-8" />
          <p className="text-sm">
            File is not downloaded in your device. Click to download.
          </p>
        </div>
      )}
    </div>
  );
};
