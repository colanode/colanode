import { isServerOutdated } from '@colanode/client/lib';
import { ServerNotFound } from '@colanode/ui/components/servers/server-not-found';
import { ServerUpgradeRequired } from '@colanode/ui/components/servers/server-upgrade-required';
import { ServerContext } from '@colanode/ui/contexts/server';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { isFeatureSupported } from '@colanode/ui/lib/features';

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

  const isOutdated = isServerOutdated(server.version);

  return (
    <ServerContext.Provider
      value={{
        ...server,
        supports: (feature) => {
          return isFeatureSupported(feature, server.version);
        },
      }}
    >
      {isOutdated ? <ServerUpgradeRequired /> : children}
    </ServerContext.Provider>
  );
};
