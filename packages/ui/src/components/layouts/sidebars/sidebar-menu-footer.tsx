import { useLiveQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';

import { UnreadState } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
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
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export function SidebarMenuFooter() {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const radar = useRadar();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const accountsQuery = useLiveQuery((q) =>
    q.from({ accounts: collections.accounts })
  );
  const accounts = accountsQuery.data ?? [];
  const currentAccount = accounts.find((a) => a.id === workspace.accountId);
  const otherAccounts = accounts.filter((a) => a.id !== workspace.accountId);
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
        <DropdownMenuLabel className="mb-1">
          {t('app.accounts')}
        </DropdownMenuLabel>
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
                  to: '/workspace/$userId',
                  params: { userId: accountItem.id },
                });
              }}
            >
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
                  <span className="truncate text-xs">{accountItem.email}</span>
                </div>
                {accountItem.id === workspace.accountId ? (
                  <Check className="size-4" />
                ) : (
                  <UnreadBadge
                    count={state.unreadCount}
                    unread={state.hasUnread}
                  />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigate({ to: '/auth/login' });
          }}
        >
          <Plus className="size-4" />
          <p className="font-medium">Add account</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
