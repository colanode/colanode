import { useEffect } from 'react';

import { Event } from '@colanode/client/types';
import { useAppStore } from '@colanode/ui/stores/app';

export const useAppStoreSubscriptions = () => {
  useEffect(() => {
    const id = window.eventBus.subscribe((event: Event) => {
      if (event.type === 'app.metadata.updated') {
        useAppStore.getState().updateAppMetadata(event.metadata);
      } else if (event.type === 'app.metadata.deleted') {
        useAppStore.getState().deleteAppMetadata(event.metadata.key);
      } else if (event.type === 'account.created') {
        useAppStore.getState().upsertAccount(event.account);
      } else if (event.type === 'account.updated') {
        useAppStore.getState().upsertAccount(event.account);
      } else if (event.type === 'account.deleted') {
        useAppStore.getState().deleteAccount(event.account.id);
      } else if (event.type === 'account.metadata.updated') {
        useAppStore
          .getState()
          .updateAccountMetadata(event.accountId, event.metadata);
      } else if (event.type === 'account.metadata.deleted') {
        useAppStore
          .getState()
          .deleteAccountMetadata(event.accountId, event.metadata.key);
      } else if (event.type === 'account.connection.opened') {
        useAppStore.getState().updateAccountConnection(event.accountId, true);
      } else if (event.type === 'account.connection.closed') {
        useAppStore.getState().updateAccountConnection(event.accountId, false);
      } else if (event.type === 'workspace.created') {
        useAppStore.getState().upsertWorkspace(event.workspace);
      } else if (event.type === 'workspace.updated') {
        useAppStore.getState().upsertWorkspace(event.workspace);
      } else if (event.type === 'workspace.deleted') {
        useAppStore
          .getState()
          .deleteWorkspace(event.workspace.accountId, event.workspace.id);
      } else if (event.type === 'workspace.metadata.updated') {
        useAppStore
          .getState()
          .updateWorkspaceMetadata(
            event.accountId,
            event.workspaceId,
            event.metadata
          );
      } else if (event.type === 'workspace.metadata.deleted') {
        useAppStore
          .getState()
          .deleteWorkspaceMetadata(
            event.accountId,
            event.workspaceId,
            event.metadata.key
          );
      } else if (event.type === 'server.created') {
        useAppStore.getState().upsertServer(event.server);
      } else if (event.type === 'server.updated') {
        useAppStore.getState().upsertServer(event.server);
      } else if (event.type === 'server.deleted') {
        useAppStore.getState().deleteServer(event.server.domain);
      }
    });

    return () => {
      window.eventBus.unsubscribe(id);
    };
  }, []);
};
