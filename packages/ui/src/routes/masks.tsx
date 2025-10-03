import { createRouteMask } from '@tanstack/react-router';

import { routeTree } from '@colanode/ui/routes';

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
