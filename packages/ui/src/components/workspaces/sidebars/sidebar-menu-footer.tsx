import { useLiveQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';

import { UnreadState } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { AccountContext, useAccount } from '@colanode/ui/contexts/account';
import { useRadar } from '@colanode/ui/contexts/radar';
import { database } from '@colanode/ui/data';

export function SidebarMenuFooter() {
  const account = useAccount();
  const radar = useRadar();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const accountsQuery = useLiveQuery((q) =>
    q.from({ accounts: database.accounts })
  );
  const accounts = accountsQuery.data ?? [];
  const currentAccount = accounts.find((a) => a.id === account.id);
  const otherAccounts = accounts.filter((a) => a.id !== account.id);
  const accountUnreadStates: Record<string, UnreadState> = {};
  for (const accountItem of otherAccounts) {
    accountUnreadStates[accountItem.id] = radar.getAccountState(accountItem.id);
  }

  const hasUnread = Object.values(accountUnreadStates).some(
    (state) => state.hasUnread
  );

  const unreadCount = Object.values(accountUnreadStates).reduce(
    (acc, curr) => acc + curr.unreadCount,
    0
  );

  if (!currentAccount) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center justify-center relative mb-2 cursor-pointer outline-none">
          <Avatar
            id={currentAccount.id}
            name={currentAccount.name}
            avatar={currentAccount.avatar}
            className="size-10 rounded-lg shadow-md"
          />
          <UnreadBadge
            count={unreadCount}
            unread={hasUnread}
            className="absolute -top-1 right-0"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
        side="right"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="mb-1">Accounts</DropdownMenuLabel>
        {accounts.map((accountItem) => {
          const state = accountUnreadStates[accountItem.id] ?? {
            unreadCount: 0,
            hasUnread: false,
          };

          return (
            <DropdownMenuItem
              key={accountItem.id}
              className="p-0"
              onClick={() => {
                navigate({
                  to: '/acc/$accountId',
                  params: { accountId: accountItem.id },
                });
              }}
            >
              <AccountContext.Provider value={accountItem}>
                <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar
                    className="h-8 w-8 rounded-lg"
                    id={accountItem.id}
                    name={accountItem.name}
                    avatar={accountItem.avatar}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {accountItem.name}
                    </span>
                    <span className="truncate text-xs">
                      {accountItem.email}
                    </span>
                  </div>
                  {accountItem.id === account.id ? (
                    <Check className="size-4" />
                  ) : (
                    <UnreadBadge
                      count={state.unreadCount}
                      unread={state.hasUnread}
                    />
                  )}
                </div>
              </AccountContext.Provider>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigate({ to: '/login' });
          }}
        >
          <Plus className="size-4" />
          <p className="font-medium">Add account</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
