import { createRouteMask } from '@tanstack/react-router';

import { collections } from '@colanode/ui/collections';
import { routeTree } from '@colanode/ui/routes';

export const workspaceRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId',
  to: '/$workspaceId',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const workspaceHomeRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/home',
  to: '/$workspaceId/home',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const nodeRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/$nodeId',
  to: '/$workspaceId/$nodeId',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const workspaceSettingsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/settings',
  to: '/$workspaceId/settings',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const workspaceUsersRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/users',
  to: '/$workspaceId/users',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const workspaceStorageRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/storage',
  to: '/$workspaceId/storage',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const workspaceUploadsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/uploads',
  to: '/$workspaceId/uploads',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const workspaceDownloadsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/downloads',
  to: '/$workspaceId/downloads',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const accountSettingsRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/account',
  to: '/$workspaceId/account',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const accountLogoutRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/logout',
  to: '/$workspaceId/logout',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const appAppearanceRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/appearance',
  to: '/$workspaceId/appearance',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
    };
  },
});

export const modalNodeRouteMask = createRouteMask({
  routeTree: routeTree,
  from: '/workspace/$userId/$nodeId/modal/$modalNodeId',
  to: '/$workspaceId/$nodeId',
  params: (ctx) => {
    const workspace = collections.workspaces.get(ctx.userId);
    return {
      workspaceId: workspace?.workspaceId ?? 'unknown',
      nodeId: ctx.modalNodeId,
    };
  },
});

export const routeMasks = [
  workspaceRouteMask,
  workspaceHomeRouteMask,
  nodeRouteMask,
  modalNodeRouteMask,
  workspaceSettingsRouteMask,
  workspaceUsersRouteMask,
  workspaceStorageRouteMask,
  workspaceUploadsRouteMask,
  workspaceDownloadsRouteMask,
  accountSettingsRouteMask,
  accountLogoutRouteMask,
  appAppearanceRouteMask,
];
