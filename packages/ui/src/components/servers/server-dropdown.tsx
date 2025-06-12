import {
  ChevronDown,
  PlusIcon,
  ServerOffIcon,
  SettingsIcon,
} from 'lucide-react';
import { Fragment, useState } from 'react';

import { ServerDetails } from '@colanode/client/types';
import { ServerAvatar } from '@colanode/ui/components/servers/server-avatar';
import { ServerCreateDialog } from '@colanode/ui/components/servers/server-create-dialog';
import { ServerDeleteDialog } from '@colanode/ui/components/servers/server-delete-dialog';
import { ServerSettingsDialog } from '@colanode/ui/components/servers/server-settings-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';

interface ServerDropdownProps {
  value: string | null;
  onChange: (server: string) => void;
  servers: ServerDetails[];
  readonly?: boolean;
}

export const ServerDropdown = ({
  value,
  onChange,
  servers,
  readonly = false,
}: ServerDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [settingsDomain, setSettingsDomain] = useState<string | null>(null);
  const [deleteDomain, setDeleteDomain] = useState<string | null>(null);

  const server = value
    ? servers.find((server) => server.domain === value)
    : null;
  const settingsServer = servers.find(
    (server) => server.domain === settingsDomain
  );
  const deleteServer = servers.find((server) => server.domain === deleteDomain);

  return (
    <Fragment>
      <DropdownMenu
        open={open}
        onOpenChange={(openValue) => {
          if (!readonly) {
            setOpen(openValue);
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <div className="flex w-full flex-grow flex-row items-center gap-3 rounded-md border border-input p-2 cursor-pointer hover:bg-gray-100">
            {server ? (
              <ServerAvatar
                url={server.avatar}
                name={server.name}
                className="size-8 rounded-md"
              />
            ) : (
              <ServerOffIcon className="size-8 text-muted-foreground rounded-md" />
            )}
            <div className="flex-grow">
              {server ? (
                <Fragment>
                  <p className="flex-grow font-semibold">{server.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {server.domain}
                  </p>
                </Fragment>
              ) : (
                <p className="flex-grow text-muted-foreground">
                  Select a server
                </p>
              )}
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-96">
          {servers.map((server) => (
            <DropdownMenuItem
              key={server.domain}
              onSelect={() => {
                if (value !== server.domain) {
                  onChange(server.domain);
                }
              }}
              className="group/server flex w-full flex-grow flex-row items-center gap-3 rounded-md border-b border-input p-2 cursor-pointer hover:bg-gray-100"
            >
              <div className="flex flex-grow items-center gap-3">
                <ServerAvatar
                  url={server.avatar}
                  name={server.name}
                  className="size-8 rounded-md"
                />
                <div className="flex-grow">
                  <p className="flex-grow font-semibold">{server.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {server.domain}
                  </p>
                </div>
              </div>
              <button
                className="text-muted-foreground opacity-0 group-hover/server:opacity-100 hover:bg-gray-200 size-8 flex items-center justify-center rounded-md cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setSettingsDomain(server.domain);
                }}
              >
                <SettingsIcon className="size-4" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setOpenCreate(true);
            }}
            className="py-2"
          >
            <PlusIcon className="size-4" />
            Add new server
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openCreate && (
        <ServerCreateDialog
          onCancel={() => setOpenCreate(false)}
          onCreate={() => {
            setOpenCreate(false);
          }}
        />
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
    </Fragment>
  );
};
