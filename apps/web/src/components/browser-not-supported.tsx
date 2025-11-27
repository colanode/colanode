import { MonitorOff } from 'lucide-react';

export const BrowserNotSupported = () => {
  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center w-lg">
        <MonitorOff className="h-10 w-10 text-foreground" />
        <h2 className="text-4xl text-foreground">Browser not supported</h2>
        <p className="text-sm text-muted-foreground">
          Unfortunately, your browser does not support the Origin Private File
          System (OPFS) feature that Colanode requires to function properly.
        </p>
        <p className="text-sm text-muted-foreground">
          If you're self-hosting Colanode make sure you are accessing the web
          version through a secure 'https' way, because some browsers require
          HTTPS to use the features required.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          You can try using the{' '}
          <a
            href="https://colanode.com/downloads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            Desktop app
          </a>{' '}
          instead or try another browser. If you think this is a mistake or you
          have any questions, please open an issue on{' '}
          <a
            href="https://github.com/colanode/colanode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            Github
          </a>
        </p>
      </div>
    </div>
  );
};
