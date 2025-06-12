import { CircleFadingArrowUp } from 'lucide-react';

import { useServer } from '@colanode/ui/contexts/server';

export const ServerUpgradeRequired = () => {
  const server = useServer();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center w-128">
        <CircleFadingArrowUp className="h-10 w-10 text-gray-800" />
        <h2 className="text-4xl text-gray-800">Server upgrade required</h2>
        <p className="text-sm text-gray-500">
          The Colanode server{' '}
          <span className="font-semibold">{server.name}</span> with domain{' '}
          <span className="font-semibold">{server.domain}</span> is running an
          outdated version and cannot serve this workspace. Please ask your
          administrator to upgrade it to the latest release.
        </p>
        <p className="text-sm text-gray-500">
          Check the{' '}
          <a
            href="https://github.com/colanode/colanode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Github repository
          </a>
        </p>
      </div>
    </div>
  );
};
