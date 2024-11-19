import React from 'react';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useAccount } from '@/renderer/contexts/account';
import { toast } from '@/renderer/hooks/use-toast';

interface AvatarUploadProps {
  onUpload: (id: string) => void;
}

export const AvatarUpload = ({ onUpload }: AvatarUploadProps) => {
  const account = useAccount();
  const { mutate, isPending } = useMutation();

  const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false);
  const [url, setUrl] = React.useState<string | undefined>(undefined);

  const handleSubmit = async (_: string) => {
    // TODO
  };

  return (
    <div className="h-[280px] min-h-[280px] w-[360px] min-w-[360px] p-1">
      <form
        className="mb-5 flex gap-x-2"
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (url) {
            await handleSubmit(url);
          }
        }}
      >
        <input
          type="text"
          name="url"
          className="w-full flex-1 rounded-md bg-gray-100 p-2 text-xs focus:outline-none"
          placeholder="Paste link to an image..."
          onChange={(e) => setUrl(e.target.value)}
          autoComplete="off"
        />
        <Button
          type="submit"
          className="h-auto px-3 py-0 text-sm"
          disabled={!url}
        >
          Submit
        </Button>
      </form>
      <Button
        type="button"
        className="w-full"
        variant="outline"
        disabled={isPending || isFileDialogOpen}
        onClick={async () => {
          if (isPending || isFileDialogOpen) {
            return;
          }

          setIsFileDialogOpen(true);
          const result = await window.colanode.executeCommand({
            type: 'file_dialog_open',
            options: {
              properties: ['openFile'],
              filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }],
            },
          });

          if (result.canceled || !result.filePaths.length) {
            setIsFileDialogOpen(false);
            return;
          }

          const filePath = result.filePaths[0];
          mutate({
            input: {
              type: 'avatar_upload',
              accountId: account.id,
              filePath: filePath,
            },
            onSuccess(output) {
              if (output.status === 'success' && output.id) {
                onUpload(output.id);
              }
              setIsFileDialogOpen(false);
            },
            onError() {
              toast({
                title: 'Failed to upload avatar',
                description:
                  'Something went wrong trying to upload avatar. Please try again.',
                variant: 'destructive',
              });
              setIsFileDialogOpen(false);
            },
          });
        }}
      >
        {isPending && <Spinner className="mr-1" />}
        Upload file
      </Button>
      <div className="mt-4 flex flex-col gap-y-4 text-center text-xs text-gray-500">
        <div className="">Recommended size is 280px x 280px</div>
        <div className="">The maximum size per file is 5MB.</div>
      </div>
    </div>
  );
};
