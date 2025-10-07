import { database } from '@colanode/ui/data';

export const getDefaultAccount = () => {
  const accountsIds = database.accounts.map((account) => account.id);
  const lastUsedAccountId = database.metadata.get('account')?.value as
    | string
    | undefined;

  if (lastUsedAccountId && accountsIds.includes(lastUsedAccountId)) {
    return lastUsedAccountId;
  }

  const defaultAccount = accountsIds[0];
  if (defaultAccount) {
    return defaultAccount;
  }

  return undefined;
};

export const getAccountForWorkspace = (workspaceId: string) => {
  console.log('Colanode | Getting account for workspace', workspaceId);
  const accountsIds = database.accounts.map((account) => account.id);
  console.log('Colanode | Accounts ids', accountsIds);
  for (const accountId of accountsIds) {
    const workspaceIds = database
      .accountWorkspaces(accountId)
      .map((workspace) => workspace.id);

    if (workspaceIds.includes(workspaceId)) {
      return accountId;
    }
  }

  return undefined;
};
