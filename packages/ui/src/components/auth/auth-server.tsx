import { useLiveQuery } from '@tanstack/react-db';
import { ArrowRight, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Server } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { ServerAvatar } from '@colanode/ui/components/servers/server-avatar';
import { ServerCreateDialog } from '@colanode/ui/components/servers/server-create-dialog';

interface AuthServerProps {
  onSelect: (server: Server) => void;
}

export const AuthServer = ({ onSelect }: AuthServerProps) => {
  const serversQuery = useLiveQuery((q) =>
    q.from({ servers: collections.servers })
  );
  const servers = serversQuery.data ?? [];

  const [openCreate, setOpenCreate] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Select a server
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose the server you want to connect to
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {servers.map((server) => (
          <button
            key={server.domain}
            onClick={() => onSelect(server)}
            className="group/server relative flex w-full flex-row items-center gap-3 rounded-lg border border-border/60 bg-background p-3 text-left transition-all hover:cursor-pointer hover:border-border hover:bg-accent hover:shadow-md"
          >
            <ServerAvatar
              url={server.avatar}
              name={server.name}
              className="w-10 h-auto rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold text-foreground">
                {server.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {server.domain}
              </p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover/server:opacity-100" />
          </button>
        ))}
        <button
          onClick={() => setOpenCreate(true)}
          className="group/server relative flex w-full flex-row items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background p-2 text-left transition-all hover:cursor-pointer hover:border-border hover:bg-accent hover:shadow-md"
        >
          <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/50">
            <PlusIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-normal text-foreground">
              Add a new server
            </p>
          </div>
        </button>
      </div>
      {openCreate && (
        <ServerCreateDialog onCancel={() => setOpenCreate(false)} />
      )}
    </div>
  );
};
