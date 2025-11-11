import { useNavigate } from '@tanstack/react-router';
import { FileX } from 'lucide-react';

import { Button } from '@colanode/ui/components/ui/button';

export const AppNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <FileX className="size-12 mb-4 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        The page you are looking for was not found, or has been deleted, or you
        don't have access to it anymore.
      </p>
      <Button
        onClick={() => {
          navigate({
            to: '/',
            replace: true,
          });
        }}
      >
        Go back home
      </Button>
    </div>
  );
};
