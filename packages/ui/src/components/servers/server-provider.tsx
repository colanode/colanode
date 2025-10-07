import { eq, useLiveQuery } from '@tanstack/react-db';

import { isFeatureSupported } from '@colanode/client/lib';
import { ServerNotFound } from '@colanode/ui/components/servers/server-not-found';
import { ServerContext } from '@colanode/ui/contexts/server';
import { database } from '@colanode/ui/data';

interface ServerProviderProps {
  domain: string;
  children: React.ReactNode;
}

export const ServerProvider = ({ domain, children }: ServerProviderProps) => {
  const serverQuery = useLiveQuery((q) =>
    q
      .from({ servers: database.servers })
      .where(({ servers }) => eq(servers.domain, domain))
      .select(({ servers }) => servers)
  );

  const server = serverQuery.data?.[0];
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
