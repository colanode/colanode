import { eq, useLiveQuery } from '@tanstack/react-db';

import { isFeatureSupported } from '@colanode/client/lib';
import { collections } from '@colanode/ui/collections';
import { ServerNotFound } from '@colanode/ui/components/servers/server-not-found';
import { ServerContext } from '@colanode/ui/contexts/server';

interface ServerProviderProps {
  domain: string;
  children: React.ReactNode;
}

export const ServerProvider = ({ domain, children }: ServerProviderProps) => {
  const serverQuery = useLiveQuery(
    (q) =>
      q
        .from({ servers: collections.servers })
        .where(({ servers }) => eq(servers.domain, domain))
        .findOne(),
    [domain]
  );

  const server = serverQuery.data;
  if (!server) {
    return <ServerNotFound domain={domain} />;
  }

  return (
    <ServerContext.Provider
      value={{
        ...server,
        supports: (feature) => {
          return isFeatureSupported(feature, server.version);
        },
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};
