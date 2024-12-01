import { Check, ChevronsUpDown, LogOut, Plus, Settings } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { ReadStateIndicator } from '@/renderer/components/layouts/read-state-indicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/renderer/components/ui/sidebar';
import { useAccount } from '@/renderer/contexts/account';
import { useRadar } from '@/renderer/contexts/radar';
import { useQuery } from '@/renderer/hooks/use-query';
import { AccountReadState } from '@/shared/types/radars';

export function LayoutSidebarFooter() {
  const account = useAccount();
  const navigate = useNavigate();
  const radar = useRadar();

  const [open, setOpen] = React.useState(false);
  const { data } = useQuery({
    type: 'account_list',
  });

  const accounts = data ?? [];
  const otherAccounts = accounts.filter((a) => a.id !== account.id);
  const accountStates: Record<string, AccountReadState> = {};
  for (const accountItem of otherAccounts) {
    accountStates[accountItem.id] = radar.getAccountState(accountItem.id);
  }

  const importantCount = Object.values(accountStates).reduce(
    (acc, curr) => acc + curr.importantCount,
    0
  );
  const hasUnseenChanges = Object.values(accountStates).some(
    (state) => state.hasUnseenChanges
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar
                className="h-8 w-8 rounded-lg"
                id={account.id}
                name={account.name}
                avatar={account.avatar}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{account.name}</span>
                <span className="truncate text-xs">{account.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
              <ReadStateIndicator
                count={importantCount}
                hasChanges={hasUnseenChanges}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem key={account.id} className="p-0">
              <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  className="h-8 w-8 rounded-lg"
                  id={account.id}
                  name={account.name}
                  avatar={account.avatar}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{account.name}</span>
                  <span className="truncate text-xs">{account.email}</span>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                account.openSettings();
              }}
            >
              <Settings className="size-4" />
              <p className="font-medium">Settings</p>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                account.openLogout();
              }}
            >
              <LogOut className="size-4" />
              <p className="font-medium">Logout</p>
            </DropdownMenuItem>
            {otherAccounts.length > 0 && (
              <React.Fragment>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="mb-1">Accounts</DropdownMenuLabel>
                {accounts.map((accountItem) => {
                  const state = accountStates[accountItem.id] ?? {
                    importantCount: 0,
                    hasUnseenChanges: false,
                  };

                  return (
                    <DropdownMenuItem
                      key={accountItem.id}
                      className="p-0"
                      onClick={() => {
                        navigate(`/${accountItem.id}`);
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
                          <span className="truncate text-xs">
                            {accountItem.email}
                          </span>
                        </div>
                        {accountItem.id === account.id ? (
                          <Check className="size-4" />
                        ) : (
                          <ReadStateIndicator
                            count={state.importantCount}
                            hasChanges={state.hasUnseenChanges}
                          />
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </React.Fragment>
            )}

            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigate(`/login`);
              }}
            >
              <Plus className="size-4" />
              <p className="font-medium">Add account</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
