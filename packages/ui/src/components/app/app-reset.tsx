import { useMutation } from '@tanstack/react-query';
import { CircleFadingArrowUp } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@colanode/ui/components/ui/button';

export const AppReset = () => {
  const mutation = useMutation({
    mutationFn: () => {
      return window.colanode.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="flex h-screen w-full items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8 text-center w-lg">
        <CircleFadingArrowUp className="h-10 w-10 text-foreground" />
        <h2 className="text-4xl text-foreground">Colanode updated</h2>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Colanode has been upgraded to a new version and needs to reset local
            app data to ensure compatibility.
          </p>
          <p className="text-sm text-muted-foreground">
            You will need to log in again to continue using Colanode.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => {
            if (mutation.isPending) {
              return;
            }

            mutation.mutate();
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
