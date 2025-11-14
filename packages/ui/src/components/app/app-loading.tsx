import { DelayedComponent } from '@colanode/ui/components/ui/delayed-component';
import { Spinner } from '@colanode/ui/components/ui/spinner';

export const AppLoading = () => {
  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <DelayedComponent>
        <div className="flex flex-row items-center gap-6">
          <h2 className="font-satoshi tracking-tight text-4xl">
            loading your workspace
          </h2>
          <Spinner className="size-6" />
        </div>
      </DelayedComponent>
    </div>
  );
};
