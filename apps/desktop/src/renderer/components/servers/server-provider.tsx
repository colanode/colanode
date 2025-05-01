import { ServerContext } from '@/renderer/contexts/server';
import { useQuery } from '@/renderer/hooks/use-query';
import { ServerNotFound } from '@/renderer/components/servers/server-not-found';
import { isFeatureSupported } from '@/shared/lib/features';

interface ServerProviderProps {
  domain: string;
  children: React.ReactNode;
}

export const ServerProvider = ({ domain, children }: ServerProviderProps) => {
  const { data, isPending } = useQuery({
    type: 'server_list',
  });

  const server = data?.find((server) => server.domain === domain);

  if (isPending) {
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
