import { ChevronDown } from 'lucide-react';
import { Fragment, useState } from 'react';

import { Server } from '@colanode/client/types';
import { ServerAvatar } from '@colanode/ui/components/servers/server-avatar';
import { ServerCreateDialog } from '@colanode/ui/components/servers/server-create-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';

interface ServerDropdownProps {
  value: Server;
  onChange: (server: Server) => void;
  servers: Server[];
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
            <ServerAvatar
              url={value.avatar}
              name={value.name}
              className="size-8 rounded-md"
            />
            <div className="flex-grow">
              <p className="flex-grow font-semibold">{value.name}</p>
              <p className="text-xs text-muted-foreground">{value.domain}</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-96">
          {servers.map((server) => (
            <DropdownMenuItem
              key={server.domain}
              onSelect={() => {
                if (value.domain !== server.domain) {
                  onChange(server);
                }
              }}
              className="flex w-full flex-grow flex-row items-center gap-3 rounded-md border-b border-input p-2 cursor-pointer hover:bg-gray-100"
            >
              <ServerAvatar
                url={server.avatar}
                name={server.name}
                className="size-8 rounded-md"
              />
              <div className="flex-grow">
                <p className="flex-grow font-semibold">{server.name}</p>
                <p className="text-xs text-muted-foreground">{server.domain}</p>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setOpenCreate(true);
            }}
            className="py-2"
          >
            Add new server
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openCreate && (
        <ServerCreateDialog
          onCancel={() => setOpenCreate(false)}
          onCreate={(server) => {
            setOpenCreate(false);
            onChange(server);
          }}
        />
      )}
    </Fragment>
  );
};
