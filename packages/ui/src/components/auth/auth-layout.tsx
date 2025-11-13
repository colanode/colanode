import { useLiveQuery } from '@tanstack/react-db';
import { Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { collections } from '@colanode/ui/collections';
import { AuthCancel } from '@colanode/ui/components/auth/auth-cancel';
import { ColanodeLogo } from '@colanode/ui/components/ui/logo';
import { AuthContext } from '@colanode/ui/contexts/auth';

export const AuthLayout = () => {
  const serversQuery = useLiveQuery((q) =>
    q.from({ servers: collections.servers })
  );
  const servers = serversQuery.data;

  const [domain, setDomain] = useState<string | null>(
    servers[0]?.domain ?? null
  );

  useEffect(() => {
    const serverExists =
      domain !== null && servers.some((s) => s.domain === domain);
    if (!serverExists && servers.length > 0) {
      setDomain(servers[0]!.domain);
    }
  }, [domain, servers]);

  const server = domain
    ? (servers.find((s) => s.domain === domain) ?? null)
    : null;

  return (
    <AuthContext.Provider
      value={{
        servers,
        server: server!,
        setServer(domain) {
          setDomain(domain);
        },
      }}
    >
      <div className="flex h-screen min-h-screen w-full flex-col items-center justify-center py-12">
        <div className="mx-auto grid w-96 gap-10">
          <div className="flex justify-center">
            <ColanodeLogo className="w-20 h-20" />
          </div>
          <Outlet />
          <AuthCancel />
        </div>
      </div>
    </AuthContext.Provider>
  );
};
