import { Outlet } from '@tanstack/react-router';
import { useState } from 'react';

import { Server } from '@colanode/client/types';
import { AuthCancel } from '@colanode/ui/components/auth/auth-cancel';
import { AuthServer } from '@colanode/ui/components/auth/auth-server';
import { ColanodeLogo } from '@colanode/ui/components/ui/logo';
import { AuthContext } from '@colanode/ui/contexts/auth';

export const AuthLayout = () => {
  const [server, setServer] = useState<Server | null>(null);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center">
      <AuthCancel />
      <div className="flex w-full flex-col items-center justify-center gap-20 px-4 py-12 lg:flex-row lg:gap-32">
        <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
          <div className="flex flex-row items-center">
            <ColanodeLogo className="h-20 w-20 lg:h-64 lg:w-64" />
            <p className="font-antonio text-4xl">
              Your all-in-one <br /> collaboration platform
            </p>
          </div>
        </div>

        <div className="w-96 max-w-xl flex flex-col items-center justify-center bg-background">
          {server ? (
            <AuthContext.Provider value={{ server }}>
              <Outlet />
            </AuthContext.Provider>
          ) : (
            <AuthServer onSelect={setServer} />
          )}
        </div>
      </div>
    </div>
  );
};
