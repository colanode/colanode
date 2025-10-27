import { createRouteMask, notFound } from '@tanstack/react-router';

import { collections } from '@colanode/ui/collections';
import { routeTree } from '@colanode/ui/routes';

export const workspaceRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId',
  to: '/$workspaceId',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const workspaceHomeRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/home',
  to: '/$workspaceId/home',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const nodeRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/$nodeId',
  to: '/$workspaceId/$nodeId',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const workspaceSettingsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/settings',
  to: '/$workspaceId/settings',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const workspaceUsersRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/users',
  to: '/$workspaceId/users',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const workspaceStorageRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/storage',
  to: '/$workspaceId/storage',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const workspaceUploadsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/uploads',
  to: '/$workspaceId/uploads',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const workspaceDownloadsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/downloads',
  to: '/$workspaceId/downloads',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const accountSettingsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/account/settings',
  to: '/$workspaceId/account/settings',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const accountLogoutRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/account/logout',
  to: '/$workspaceId/account/logout',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const appAppearanceRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/app/appearance',
  to: '/$workspaceId/app/appearance',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    if (!workspace) {
      throw notFound();
    }

    return {
      workspaceId: workspace.workspaceId,
    };
  },
});

export const routeMasks = [
  workspaceRouteMask,
  workspaceHomeRouteMask,
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
