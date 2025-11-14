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
      <div className="flex w-full flex-col items-center justify-center gap-12 px-4 py-12 lg:flex-row lg:gap-24">
        <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
          <div className="flex flex-col items-center gap-8 text-center">
            <ColanodeLogo className="h-48 w-48 lg:h-64 lg:w-64" />
            <div className="space-y-4">
              <p className="text-4xl font-medium text-foreground lg:text-5xl">
                Colanode
              </p>
              <p className="max-w-md text-base text-muted-foreground lg:text-lg">
                Your all-in-one workspace for collaboration and productivity.
              </p>
            </div>
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
