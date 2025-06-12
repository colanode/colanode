import { HouseIcon } from 'lucide-react';
import { useState, Fragment, useEffect } from 'react';
import { match } from 'ts-pattern';

import { Account, Server } from '@colanode/client/types';
import { EmailLogin } from '@colanode/ui/components/accounts/email-login';
import { EmailPasswordResetComplete } from '@colanode/ui/components/accounts/email-password-reset-complete';
import { EmailPasswordResetInit } from '@colanode/ui/components/accounts/email-password-reset-init';
import { EmailRegister } from '@colanode/ui/components/accounts/email-register';
import { EmailVerify } from '@colanode/ui/components/accounts/email-verify';
import { ServerDropdown } from '@colanode/ui/components/servers/server-dropdown';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';
import { ServerContext } from '@colanode/ui/contexts/server';
import { isFeatureSupported } from '@colanode/ui/lib/features';

interface LoginFormProps {
  accounts: Account[];
  servers: Server[];
}

type LoginPanelState = {
  type: 'login';
};

type RegisterPanelState = {
  type: 'register';
};

type VerifyPanelState = {
  type: 'verify';
  id: string;
  expiresAt: Date;
};

type PasswordResetInitPanelState = {
  type: 'password_reset_init';
};

type PasswordResetCompletePanelState = {
  type: 'password_reset_complete';
  id: string;
  expiresAt: Date;
};

type PanelState =
  | LoginPanelState
  | RegisterPanelState
  | VerifyPanelState
  | PasswordResetInitPanelState
  | PasswordResetCompletePanelState;

export const LoginForm = ({ accounts, servers }: LoginFormProps) => {
  const app = useApp();
  const [server, setServer] = useState<Server | null>(servers[0] ?? null);
  const [panel, setPanel] = useState<PanelState>({
    type: 'login',
  });

  useEffect(() => {
    const serverExists =
      server !== null && servers.some((s) => s.domain === server.domain);
    if (!serverExists && servers.length > 0) {
      setServer(servers[0]!);
    }
  }, [server, servers]);

  return (
    <div className="flex flex-col gap-4">
      <ServerDropdown
        value={server}
        onChange={(server) => {
          setServer(server);
        }}
        servers={servers}
        readonly={panel.type === 'verify'}
      />
      {server && (
        <ServerContext.Provider
          value={{
            ...server,
            supports: (feature) => {
              return isFeatureSupported(feature, server.version);
            },
          }}
        >
          <div>
            {match(panel)
              .with({ type: 'login' }, () => (
                <EmailLogin
                  onSuccess={(output) => {
                    if (output.type === 'success') {
                      app.openAccount(output.account.id);
                    } else if (output.type === 'verify') {
                      setPanel({
                        type: 'verify',
                        id: output.id,
                        expiresAt: new Date(output.expiresAt),
                      });
                    }
                  }}
                  onForgotPassword={() => {
                    setPanel({
                      type: 'password_reset_init',
                    });
                  }}
                  onRegister={() => {
                    setPanel({
                      type: 'register',
                    });
                  }}
                />
              ))
              .with({ type: 'register' }, () => (
                <EmailRegister
                  onSuccess={(output) => {
                    if (output.type === 'success') {
                      app.openAccount(output.account.id);
                    } else if (output.type === 'verify') {
                      setPanel({
                        type: 'verify',
                        id: output.id,
                        expiresAt: new Date(output.expiresAt),
                      });
                    }
                  }}
                  onLogin={() => {
                    setPanel({
                      type: 'login',
                    });
                  }}
                />
              ))
              .with({ type: 'verify' }, (p) => (
                <EmailVerify
                  id={p.id}
                  expiresAt={p.expiresAt}
                  onSuccess={(output) => {
                    if (output.type === 'success') {
                      app.openAccount(output.account.id);
                    }
                  }}
                  onBack={() => {
                    setPanel({
                      type: 'login',
                    });
                  }}
                />
              ))
              .with({ type: 'password_reset_init' }, () => (
                <EmailPasswordResetInit
                  onSuccess={(output) => {
                    setPanel({
                      type: 'password_reset_complete',
                      id: output.id,
                      expiresAt: new Date(output.expiresAt),
                    });
                  }}
                  onBack={() => {
                    setPanel({
                      type: 'login',
                    });
                  }}
                />
              ))
              .with({ type: 'password_reset_complete' }, (p) => (
                <EmailPasswordResetComplete
                  id={p.id}
                  expiresAt={p.expiresAt}
                  onBack={() => {
                    setPanel({
                      type: 'login',
                    });
                  }}
                />
              ))
              .exhaustive()}
          </div>
        </ServerContext.Provider>
      )}

      {accounts.length > 0 && (
        <Fragment>
          <Separator className="w-full" />
          <Button
            variant="link"
            className="w-full text-muted-foreground"
            type="button"
            onClick={() => {
              app.closeLogin();
            }}
          >
            <HouseIcon className="mr-1 size-4" />
            Back to workspace
          </Button>
        </Fragment>
      )}
    </div>
  );
};
