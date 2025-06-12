import { ServerNotFound } from '@colanode/ui/components/servers/server-not-found';
import { ServerContext } from '@colanode/ui/contexts/server';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { isFeatureSupported } from '@colanode/ui/lib/features';

interface ServerProviderProps {
  domain: string;
  children: React.ReactNode;
}

export const ServerProvider = ({ domain, children }: ServerProviderProps) => {
  const serverListQuery = useQuery({
    type: 'server.list',
  });

  const server = serverListQuery.data?.find(
    (server) => server.domain === domain
  );

  if (serverListQuery.isPending) {
    return null;
  }

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
