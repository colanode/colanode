import React from 'react';
import { useNavigate } from 'react-router-dom';

import { EmailLogin } from '@/renderer/components/accounts/email-login';
import { EmailRegister } from '@/renderer/components/accounts/email-register';
import { ServerDropdown } from '@/renderer/components/servers/server-dropdown';
import { Separator } from '@/renderer/components/ui/separator';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';

interface LoginFormProps {
  accounts: Account[];
  servers: Server[];
}

export const LoginForm = ({ accounts, servers }: LoginFormProps) => {
  const navigate = useNavigate();

  const [showRegister, setShowRegister] = React.useState(false);
  const [server, setServer] = React.useState(servers[0]!);

  return (
    <div className="flex flex-col gap-4">
      <ServerDropdown value={server} onChange={setServer} servers={servers} />
      {showRegister ? (
        <EmailRegister server={server} />
      ) : (
        <EmailLogin server={server} />
      )}
      <p
        className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
        onClick={() => {
          setShowRegister(!showRegister);
        }}
      >
        {showRegister
          ? 'Already have an account? Login'
          : 'No account yet? Register'}
      </p>
      {accounts.length > 0 && (
        <React.Fragment>
          <Separator className="w-full" />
          <p
            className="text-center text-sm text-muted-foreground hover:cursor-pointer hover:underline"
            onClick={() => {
              navigate(-1);
            }}
          >
            Cancel
          </p>
        </React.Fragment>
      )}
    </div>
  );
};
