import { createRoute, redirect } from '@tanstack/react-router';

import { collections } from '@colanode/ui/collections';
import { buildMetadataKey } from '@colanode/ui/collections/metadata';
import { WorkspaceCreate } from '@colanode/ui/components/workspaces/workspace-create';
import { WorkspaceCreateTab } from '@colanode/ui/components/workspaces/workspace-create-tab';
import { rootRoute } from '@colanode/ui/routes/root';

const Component = () => {
  const { accountId } = workspaceCreateRoute.useLoaderData();
  return <WorkspaceCreate accountId={accountId} />;
};

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: Component,
  beforeLoad: () => {
    const accountsCount = collections.accounts.size;
    if (accountsCount === 0) {
      throw redirect({ to: '/auth/login', replace: true });
    }
  },
  loader: () => {
    const accounts = collections.accounts.map((account) => account);
    const workspaces = collections.workspaces.map((workspace) => workspace);

    const metadataKey = buildMetadataKey('app', 'workspace');
    const metadataValue = collections.metadata.get(metadataKey)?.value;
    if (metadataValue) {
      const userId = JSON.parse(metadataValue) as string;
      const workspace = workspaces.find(
        (workspace) => workspace.userId === userId
      );

      if (workspace) {
        return {
          accountId: workspace.accountId,
        };
      }
    }

    const firstAccount = accounts[0];
    if (firstAccount) {
      return {
        accountId: firstAccount.id,
      };
    }

    // this should never happen
    throw new Error('No accounts found');
  },
  context: () => {
    return {
      tab: <WorkspaceCreateTab />,
    };
  },
});
