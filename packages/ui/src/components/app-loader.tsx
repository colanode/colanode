import { DelayedComponent } from '@colanode/ui/components/ui/delayed-component';
import { Spinner } from '@colanode/ui/components/ui/spinner';

export const AppLoader = () => {
  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <DelayedComponent>
        <div className="flex flex-col items-center gap-8 text-center">
          <h2 className="font-neotrax text-4xl">loading your workspaces</h2>
          <div>
            <Spinner />
          </div>
        </div>
      </DelayedComponent>
    </div>
  );
};
