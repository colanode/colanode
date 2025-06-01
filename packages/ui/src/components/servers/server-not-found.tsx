import { BadgeAlert } from 'lucide-react';

interface ServerNotFoundProps {
  domain: string;
}

export const ServerNotFound = ({ domain }: ServerNotFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <BadgeAlert className="size-12 mb-4" />
      <h1 className="text-2xl font-semibold tracking-tight">
        Server not found
      </h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        The server {domain} does not exist. It may have been deleted from your
        app or the data has been lost.
      </p>
    </div>
  );
};
