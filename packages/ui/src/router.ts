import {
  createRootRoute,
  createRoute,
  createRouteMask,
  createRouter,
  notFound,
  redirect,
} from '@tanstack/react-router';

import { AccountLogoutScreen } from '@colanode/ui/components/accounts/account-logout-screen';
import { AccountScreen } from '@colanode/ui/components/accounts/account-screen';
import { AccountSettingsScreen } from '@colanode/ui/components/accounts/account-settings-screen';
import { LoginScreen } from '@colanode/ui/components/accounts/login-screen';
import { AppAppearanceSettingsScreen } from '@colanode/ui/components/app/app-appearance-settings-screen';
import { NodeErrorScreen } from '@colanode/ui/components/nodes/node-error-screen';
import { NodeScreen } from '@colanode/ui/components/nodes/node-screen';
import { WorkspaceDownloadsScreen } from '@colanode/ui/components/workspaces/downloads/workspace-downloads-screen';
import { WorkspaceStorageScreen } from '@colanode/ui/components/workspaces/storage/workspace-storage-screen';
import { WorkspaceUploadsScreen } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-screen';
import { WorkspaceCreateScreen } from '@colanode/ui/components/workspaces/workspace-create-screen';
import { WorkspaceHomeScreen } from '@colanode/ui/components/workspaces/workspace-home-screen';
import { WorkspaceScreen } from '@colanode/ui/components/workspaces/workspace-screen';
import { WorkspaceSettingsScreen } from '@colanode/ui/components/workspaces/workspace-settings-screen';
import { WorkspaceUsersScreen } from '@colanode/ui/components/workspaces/workspace-users-screen';
import { useAppStore } from '@colanode/ui/stores/app';

export const rootRoute = createRootRoute();

export const appRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null,
  beforeLoad: () => {
    const state = useAppStore.getState();
    const accounts = Object.values(state.accounts);
    const lastUsedAccountId = state.metadata.account;
    if (lastUsedAccountId) {
      const lastUsedAccount = accounts.find(
        (account) => account.id === lastUsedAccountId
      );

      if (lastUsedAccount) {
        throw redirect({
          to: '/acc/$accountId',
          params: { accountId: lastUsedAccount.id },
          replace: true,
        });
      }
    }

    const defaultAccount = accounts[0];
    if (defaultAccount) {
      throw redirect({
        to: '/acc/$accountId',
        params: { accountId: defaultAccount.id },
        replace: true,
      });
    }

    throw redirect({ to: '/login', replace: true });
  },
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/acc/$accountId',
  component: AccountScreen,
});

export const accountRedirectRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const accountId = ctx.params.accountId;
    const state = useAppStore.getState();
    const account = state.accounts[accountId];
    if (!account) {
      throw notFound();
    }

    const workspaces = Object.values(account.workspaces);
    const lastUsedWorkspaceId = account.metadata.workspace;
    if (lastUsedWorkspaceId) {
      const lastUsedWorkspace = workspaces.find(
        (workspace) => workspace.id === lastUsedWorkspaceId
      );

      if (lastUsedWorkspace) {
        throw redirect({
          to: '/acc/$accountId/$workspaceId',
          params: {
            accountId: account.id,
            workspaceId: lastUsedWorkspace.id,
          },
          replace: true,
        });
      }
    }

    const defaultWorkspace = workspaces[0];
    if (defaultWorkspace) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId',
        params: { accountId: account.id, workspaceId: defaultWorkspace.id },
        replace: true,
      });
    }

    throw redirect({
      to: '/acc/$accountId/create',
      params: { accountId: account.id },
      replace: true,
    });
  },
});

export const workspaceRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/$workspaceId',
  component: WorkspaceScreen,
});

export const workspaceCatchAllRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '$',
  component: () => null,
  beforeLoad: () => {
    throw notFound();
  },
});

export const workspaceMaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$workspaceId',
  component: () => null,
  beforeLoad: (ctx) => {
    const state = useAppStore.getState();
    const accounts = Object.values(state.accounts);
    for (const account of accounts) {
      const workspaces = Object.values(account.workspaces);
      for (const workspace of workspaces) {
        if (workspace.id === ctx.params.workspaceId) {
          throw redirect({
            to: '/acc/$accountId/$workspaceId',
            params: { accountId: account.id, workspaceId: workspace.id },
            replace: true,
          });
        }
      }
    }

    throw notFound();
  },
});

export const workspaceMaskCatchAllMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '$',
  component: () => null,
});

export const workspaceRedirectRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const accountId = ctx.params.accountId;
    const workspaceId = ctx.params.workspaceId;
    const workspace =
      useAppStore.getState().accounts[accountId]?.workspaces[workspaceId];

    if (!workspace) {
      throw notFound();
    }

    const lastLocation = workspace.metadata.location;
    if (lastLocation) {
      throw redirect({ to: lastLocation, replace: true });
    }

    throw redirect({
      from: '/acc/$accountId/$workspaceId',
      to: 'home',
      replace: true,
    });
  },
});

export const workspaceHomeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/home',
  component: WorkspaceHomeScreen,
});

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/create',
  component: WorkspaceCreateScreen,
});

export const nodeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/$nodeId',
  component: NodeScreen,
  errorComponent: NodeErrorScreen,
});

export const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings',
  component: WorkspaceSettingsScreen,
});

export const workspaceUsersRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/users',
  component: WorkspaceUsersScreen,
});

export const workspaceStorageRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/storage',
  component: WorkspaceStorageScreen,
});

export const workspaceUploadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/uploads',
  component: WorkspaceUploadsScreen,
});

export const workspaceDownloadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/downloads',
  component: WorkspaceDownloadsScreen,
});

export const accountSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/settings',
  component: AccountSettingsScreen,
});

export const accountLogoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/logout',
  component: AccountLogoutScreen,
});

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettingsScreen,
});

export const routeTree = rootRoute.addChildren([
  appRedirectRoute,
  loginRoute,
  workspaceMaskRoute.addChildren([workspaceMaskCatchAllMaskRoute]),
  accountRoute.addChildren([
    accountRedirectRoute,
    workspaceCreateRoute,
    workspaceRoute.addChildren([
      workspaceRedirectRoute,
      workspaceCatchAllRoute,
      workspaceHomeRoute,
      nodeRoute,
      workspaceDownloadsRoute,
      workspaceUploadsRoute,
      workspaceStorageRoute,
      workspaceUsersRoute,
      workspaceSettingsRoute,
      accountSettingsRoute,
      accountLogoutRoute,
      appAppearanceRoute,
    ]),
  ]),
]);

export const workspaceRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId',
  to: '/$workspaceId',
});

export const workspaceCatchAllRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/$',
  to: '/$workspaceId/$',
});

export const routeMasks = [workspaceRouteMask, workspaceCatchAllRouteMask];

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
