import { isFeatureSupported } from '@colanode/client/lib';
import { ServerNotFound } from '@colanode/ui/components/servers/server-not-found';
import { ServerContext } from '@colanode/ui/contexts/server';
import { useAppStore } from '@colanode/ui/stores/app';

interface ServerProviderProps {
  domain: string;
  children: React.ReactNode;
}

export const ServerProvider = ({ domain, children }: ServerProviderProps) => {
  const server = useAppStore((state) => state.servers[domain]);

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
