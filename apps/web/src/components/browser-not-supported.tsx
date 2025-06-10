import { MonitorOff } from 'lucide-react';

export const BrowserNotSupported = () => {
  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center w-128">
        <MonitorOff className="h-10 w-10 text-gray-800" />
        <h2 className="text-4xl text-gray-800">Browser not supported</h2>
        <p className="text-sm text-gray-500">
          Unfortunately, your browser does not support some features required
          for Colanode to work. You can try using the{' '}
          <a
            href="https://colanode.com/downloads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 font-semibold"
          >
            Desktop app
          </a>{' '}
          instead or try another browser.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Colanode requires Origin Private File System (OPFS) to work. If you
          think this is a mistake or you have any questions, please open an
          issue on{' '}
          <a
            href="https://github.com/colanode/colanode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            Github
          </a>
        </p>
      </div>
    </div>
  );
};
