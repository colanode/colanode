import { SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Server } from '@colanode/client/types';
import { ServerAvatar } from '@colanode/ui/components/servers/server-avatar';
import { ServerDeleteDialog } from '@colanode/ui/components/servers/server-delete-dialog';
import { ServerSettingsDialog } from '@colanode/ui/components/servers/server-settings-dialog';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface ServerCardProps {
  server: Server;
  onSelect: (server: Server) => void;
}

export const ServerCard = ({ server, onSelect }: ServerCardProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutate: syncServer, isPending: isSyncing } = useMutation();

  const handleServerClick = () => {
    if (isSyncing) return;

    syncServer({
      input: {
        type: 'server.sync',
        domain: server.domain,
      },
      onSuccess() {
        onSelect(server);
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  return (
    <>
      <button
        onClick={handleServerClick}
        disabled={isSyncing}
        className="group/server relative flex w-full flex-row items-center gap-3 rounded-lg border border-border/60 bg-background p-2 text-left transition-all hover:cursor-pointer hover:border-border hover:bg-accent hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="text-muted-foreground opacity-0 group-hover/server:opacity-100 hover:bg-input size-8 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-100"
          disabled={isSyncing}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setSettingsOpen(true);
          }}
        >
          {isSyncing ? (
            <Spinner className="size-4" />
          ) : (
            <SettingsIcon className="size-4" />
          )}
        </button>
      </button>
      <ServerSettingsDialog
        server={server}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onDelete={() => {
          setSettingsOpen(false);
          setDeleteOpen(true);
        }}
      />
      <ServerDeleteDialog
        server={server}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
};
