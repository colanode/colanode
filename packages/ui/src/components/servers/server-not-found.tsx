import { useNavigate } from '@tanstack/react-router';
import { BadgeAlert } from 'lucide-react';

import { Button } from '@colanode/ui/components/ui/button';

interface ServerNotFoundProps {
  domain: string;
}

export const ServerNotFound = ({ domain }: ServerNotFoundProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <BadgeAlert className="size-12 mb-4 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Server not found
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        The server {domain} does not exist. It may have been deleted from your
        app or the data has been lost.
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
