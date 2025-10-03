import { useAppStore } from '@colanode/ui/stores/app';

export const getDefaultAccount = () => {
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

export const getAccountForWorkspace = (workspaceId: string) => {
  const state = useAppStore.getState();
  const accounts = Object.values(state.accounts);
  return accounts.find((account) =>
    Object.values(account.workspaces).some(
      (workspace) => workspace.id === workspaceId
    )
  );
};
