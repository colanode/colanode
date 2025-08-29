import { LoginForm } from '@colanode/ui/components/accounts/login-form';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const Login = () => {
  const accountListQuery = useLiveQuery({
    type: 'account.list',
  });

  const serverListQuery = useLiveQuery({
    type: 'server.list',
  });

  if (accountListQuery.isPending || serverListQuery.isPending) {
    return null;
  }

  return (
    <div className="grid h-screen min-h-screen w-full grid-cols-5">
      <div className="col-span-2 flex items-center justify-center bg-foreground">
        <h1 className="font-neotrax text-6xl text-background">colanode</h1>
      </div>
      <div className="col-span-3 flex items-center justify-center py-12">
        <div className="mx-auto grid w-96 gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login to Colanode
            </h1>
            <p className="text-sm text-muted-foreground">
              Use one of the following methods to login
            </p>
          </div>
          <LoginForm
            accounts={accountListQuery.data ?? []}
            servers={serverListQuery.data ?? []}
          />
        </div>
      </div>
    </div>
  );
};
