import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { openFileDialog } from '@colanode/ui/lib/files';

interface AvatarUploadProps {
  onUpload: (id: string) => void;
}

export const AvatarUpload = ({ onUpload }: AvatarUploadProps) => {
  const account = useAccount();
  const { mutate, isPending } = useMutation();

  const [url, setUrl] = useState<string | undefined>(undefined);

  const handleSubmit = async (_: string) => {
    // TODO
  };

  return (
    <div className="h-[280px] min-h-[280px] w-[340px] min-w-[340px] p-1">
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
        className="w-full cursor-pointer"
        variant="outline"
        disabled={isPending}
        onClick={async () => {
          if (isPending) {
            return;
          }

          const result = await openFileDialog({
            accept: 'image/jpeg, image/jpg, image/png, image/webp',
          });

          if (result.type === 'success') {
            const file = result.files[0];
            if (!file) {
              return;
            }

            mutate({
              input: {
                type: 'avatar.upload',
                accountId: account.id,
                file,
              },
              onSuccess(output) {
                onUpload(output.id);
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          } else if (result.type === 'error') {
            toast.error(result.error);
          }
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
