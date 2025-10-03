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
import { NodeTab } from '@colanode/ui/components/nodes/node-tab';
import { WorkspaceDownloadsScreen } from '@colanode/ui/components/workspaces/downloads/workspace-downloads-screen';
import { WorkspaceStorageScreen } from '@colanode/ui/components/workspaces/storage/workspace-storage-screen';
import { WorkspaceUploadsScreen } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-screen';
import { WorkspaceCreateScreen } from '@colanode/ui/components/workspaces/workspace-create-screen';
import { WorkspaceHomeScreen } from '@colanode/ui/components/workspaces/workspace-home-screen';
import { WorkspaceScreen } from '@colanode/ui/components/workspaces/workspace-screen';
import { WorkspaceSettingsScreen } from '@colanode/ui/components/workspaces/workspace-settings-screen';
import { WorkspaceTab } from '@colanode/ui/components/workspaces/workspace-tab';
import { WorkspaceUsersScreen } from '@colanode/ui/components/workspaces/workspace-users-screen';
import { useAppStore } from '@colanode/ui/stores/app';

const findDefaultAccount = () => {
  const state = useAppStore.getState();
  const accounts = Object.values(state.accounts);
  const lastUsedAccountId = state.metadata.account;
  if (lastUsedAccountId) {
    const lastUsedAccount = accounts.find(
      (account) => account.id === lastUsedAccountId
    );

    if (lastUsedAccount) {
      return lastUsedAccount;
    }
  }

  const defaultAccount = accounts[0];
  if (defaultAccount) {
    return defaultAccount;
  }

  return undefined;
};

const findAccountForWorkspace = (workspaceId: string) => {
  const state = useAppStore.getState();
  const accounts = Object.values(state.accounts);
  return accounts.find((account) =>
    Object.values(account.workspaces).some(
      (workspace) => workspace.id === workspaceId
    )
  );
};

export const rootRoute = createRootRoute();

export const appRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null,
  beforeLoad: () => {
    const defaultAccount = findDefaultAccount();
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
  context: (ctx) => {
    return {
      tab: (
        <WorkspaceTab
          accountId={ctx.params.accountId}
          workspaceId={ctx.params.workspaceId}
        />
      ),
    };
  },
});

export const workspaceMaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$workspaceId',
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

export const workspaceRedirectMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/home',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const workspaceHomeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/home',
  component: WorkspaceHomeScreen,
});

export const workspaceHomeMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/home',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/home',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/create',
  component: WorkspaceCreateScreen,
});

export const workspaceCreateMaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: () => null,
  beforeLoad: () => {
    const account = findDefaultAccount();
    if (account) {
      throw redirect({
        to: '/acc/$accountId/create',
        params: { accountId: account.id },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const nodeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/$nodeId',
  component: NodeScreen,
  errorComponent: NodeErrorScreen,
  context: (ctx) => {
    return {
      tab: (
        <NodeTab
          accountId={ctx.params.accountId}
          workspaceId={ctx.params.workspaceId}
          nodeId={ctx.params.nodeId}
        />
      ),
    };
  },
});

export const nodeMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/$nodeId',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/$nodeId',
        params: {
          accountId: account.id,
          workspaceId: ctx.params.workspaceId,
          nodeId: ctx.params.nodeId,
        },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings',
  component: WorkspaceSettingsScreen,
});

export const workspaceSettingsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/settings',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/settings',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const workspaceUsersRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/users',
  component: WorkspaceUsersScreen,
});

export const workspaceUsersMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/users',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/users',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const workspaceStorageRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/storage',
  component: WorkspaceStorageScreen,
});

export const workspaceStorageMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/storage',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/storage',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const workspaceUploadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/uploads',
  component: WorkspaceUploadsScreen,
});

export const workspaceUploadsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/uploads',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/uploads',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const workspaceDownloadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/downloads',
  component: WorkspaceDownloadsScreen,
});

export const workspaceDownloadsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/downloads',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/downloads',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const accountSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/settings',
  component: AccountSettingsScreen,
});

export const accountSettingsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/account/settings',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/account/settings',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const accountLogoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/logout',
  component: AccountLogoutScreen,
});

export const accountLogoutMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/account/logout',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/account/logout',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettingsScreen,
});

export const appAppearanceMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/app/appearance',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = findAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/app/appearance',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});

export const routeTree = rootRoute.addChildren([
  appRedirectRoute,
  loginRoute,
  accountRoute.addChildren([
    accountRedirectRoute,
    workspaceCreateRoute,
    workspaceRoute.addChildren([
      workspaceRedirectRoute,
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
  workspaceCreateMaskRoute,
  workspaceMaskRoute.addChildren([
    workspaceRedirectMaskRoute,
    workspaceHomeMaskRoute,
    nodeMaskRoute,
    workspaceSettingsMaskRoute,
    workspaceUsersMaskRoute,
    workspaceStorageMaskRoute,
    workspaceUploadsMaskRoute,
    workspaceDownloadsMaskRoute,
    accountSettingsMaskRoute,
    accountLogoutMaskRoute,
    appAppearanceMaskRoute,
  ]),
]);

export const workspaceRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId',
  to: '/$workspaceId',
});

export const workspaceHomeRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/home',
  to: '/$workspaceId/home',
});

export const workspaceCreateRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/create',
  to: '/create',
});

export const nodeRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/$nodeId',
  to: '/$workspaceId/$nodeId',
});

export const workspaceSettingsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/settings',
  to: '/$workspaceId/settings',
});

export const workspaceUsersRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/users',
  to: '/$workspaceId/users',
});

export const workspaceStorageRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/storage',
  to: '/$workspaceId/storage',
});

export const workspaceUploadsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/uploads',
  to: '/$workspaceId/uploads',
});

export const workspaceDownloadsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/downloads',
  to: '/$workspaceId/downloads',
});

export const accountSettingsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/account/settings',
  to: '/$workspaceId/account/settings',
});

export const accountLogoutRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/account/logout',
  to: '/$workspaceId/account/logout',
});

export const appAppearanceRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/acc/$accountId/$workspaceId/app/appearance',
  to: '/$workspaceId/app/appearance',
});

export const routeMasks = [
  workspaceRouteMask,
  workspaceHomeRouteMask,
  workspaceCreateRouteMask,
  nodeRouteMask,
  workspaceSettingsRouteMask,
  workspaceUsersRouteMask,
  workspaceStorageRouteMask,
  workspaceUploadsRouteMask,
  workspaceDownloadsRouteMask,
  accountSettingsRouteMask,
  accountLogoutRouteMask,
  appAppearanceRouteMask,
];

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
