import { useState, Fragment, useEffect } from 'react';

import { Account, Server } from '@colanode/client/types';
import { EmailLogin } from '@colanode/ui/components/accounts/email-login';
import { EmailPasswordResetComplete } from '@colanode/ui/components/accounts/email-password-reset-complete';
import { EmailPasswordResetInit } from '@colanode/ui/components/accounts/email-password-reset-init';
import { EmailRegister } from '@colanode/ui/components/accounts/email-register';
import { EmailVerify } from '@colanode/ui/components/accounts/email-verify';
import { ServerDropdown } from '@colanode/ui/components/servers/server-dropdown';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';

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
  const [server, setServer] = useState<string | null>(
    servers[0]?.domain ?? null
  );
  const [panel, setPanel] = useState<PanelState>({
    type: 'login',
  });

  useEffect(() => {
    const serverExists =
      server !== null && servers.some((s) => s.domain === server);
    if (!serverExists && servers.length > 0) {
      setServer(servers[0]!.domain);
    }
  }, [server, servers]);

  return (
    <div className="flex flex-col gap-4">
      <ServerDropdown
        value={server}
        onChange={setServer}
        servers={servers}
        readonly={panel.type === 'verify'}
      />
      {server && panel.type === 'login' && (
        <Fragment>
          <EmailLogin
            server={server}
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
          />
          <p
            className="text-center text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'register',
              });
            }}
          >
            No account yet? Register
          </p>
        </Fragment>
      )}
      {server && panel.type === 'register' && (
        <Fragment>
          <EmailRegister
            server={server}
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
          />
          <p
            className="text-center text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'login',
              });
            }}
          >
            Already have an account? Login
          </p>
        </Fragment>
      )}

      {server && panel.type === 'verify' && (
        <Fragment>
          <EmailVerify
            server={server}
            id={panel.id}
            expiresAt={panel.expiresAt}
            onSuccess={(output) => {
              if (output.type === 'success') {
                app.openAccount(output.account.id);
              }
            }}
          />
          <p
            className="text-center text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'login',
              });
            }}
          >
            Back to login
          </p>
        </Fragment>
      )}

      {server && panel.type === 'password_reset_init' && (
        <Fragment>
          <EmailPasswordResetInit
            server={server}
            onSuccess={(output) => {
              setPanel({
                type: 'password_reset_complete',
                id: output.id,
                expiresAt: new Date(output.expiresAt),
              });
            }}
          />
          <p
            className="text-center text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'login',
              });
            }}
          >
            Back to login
          </p>
        </Fragment>
      )}

      {server && panel.type === 'password_reset_complete' && (
        <Fragment>
          <EmailPasswordResetComplete
            server={server}
            id={panel.id}
            expiresAt={panel.expiresAt}
          />
          <p
            className="text-center text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={() => {
              setPanel({
                type: 'login',
              });
            }}
          >
            Back to login
          </p>
        </Fragment>
      )}

      {accounts.length > 0 && (
        <Fragment>
          <Separator className="w-full" />
          <p
            className="text-center text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={() => {
              app.closeLogin();
            }}
          >
            Cancel
          </p>
        </Fragment>
      )}
    </div>
  );
};
