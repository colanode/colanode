import { Spinner } from '@colanode/ui/components/ui/spinner';

export const AppLoader = () => {
  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <h2 className="font-neotrax text-4xl text-gray-800">
          loading your workspaces
        </h2>
        <div>
          <Spinner />
        </div>
      </div>
    </div>
  );
};
