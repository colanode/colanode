import { useLiveQuery } from '@tanstack/react-db';
import { PlusIcon, SettingsIcon } from 'lucide-react';
import { useState } from 'react';

import { Server } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { ServerAvatar } from '@colanode/ui/components/servers/server-avatar';
import { ServerCreateDialog } from '@colanode/ui/components/servers/server-create-dialog';
import { ServerDeleteDialog } from '@colanode/ui/components/servers/server-delete-dialog';
import { ServerSettingsDialog } from '@colanode/ui/components/servers/server-settings-dialog';

interface AuthServerProps {
  onSelect: (server: Server) => void;
}

export const AuthServer = ({ onSelect }: AuthServerProps) => {
  const [openCreate, setOpenCreate] = useState(false);
  const [settingsDomain, setSettingsDomain] = useState<string | null>(null);
  const [deleteDomain, setDeleteDomain] = useState<string | null>(null);
  const serversQuery = useLiveQuery((q) =>
    q.from({ servers: collections.servers })
  );
  const servers = serversQuery.data ?? [];
  const settingsServer = servers.find(
    (server) => server.domain === settingsDomain
  );
  const deleteServer = servers.find((server) => server.domain === deleteDomain);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          {servers.length > 0 ? 'Select a server' : 'Add a server'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {servers.length > 0
            ? 'Choose the server you want to connect to'
            : 'Add a server to get started'}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {servers.map((server) => (
          <button
            key={server.domain}
            onClick={() => onSelect(server)}
            className="group/server relative flex w-full flex-row items-center gap-3 rounded-lg border border-border/60 bg-background p-2 text-left transition-all hover:cursor-pointer hover:border-border hover:bg-accent hover:shadow-md"
          >
            <ServerAvatar
              url={server.avatar}
              name={server.name}
              className="size-8 rounded-md"
            />
            <div className="grow">
              <p className="grow font-semibold">{server.name}</p>
              <p className="text-xs text-muted-foreground">{server.domain}</p>
            </div>
            <button
              className="text-muted-foreground opacity-0 group-hover/server:opacity-100 hover:bg-input size-8 flex items-center justify-center rounded-md cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSettingsDomain(server.domain);
              }}
            >
              <SettingsIcon className="size-4" />
            </button>
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
      {deleteServer && (
        <ServerDeleteDialog
          server={deleteServer}
          open={!!deleteServer}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDomain(null);
            }
          }}
        />
      )}
      {settingsServer && (
        <ServerSettingsDialog
          server={settingsServer}
          open={!!settingsServer}
          onOpenChange={(open) => {
            if (!open) {
              setSettingsDomain(null);
            }
          }}
          onDelete={() => {
            setSettingsDomain(null);
            setDeleteDomain(settingsServer.domain);
          }}
        />
      )}
    </div>
  );
};
