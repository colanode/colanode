import { CircleFadingArrowUp } from 'lucide-react';

import { useI18n } from '@colanode/ui/contexts/i18n';
import { useServer } from '@colanode/ui/contexts/server';

export const ServerUpgradeRequired = () => {
  const { t } = useI18n();
  const server = useServer();

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center w-lg">
        <CircleFadingArrowUp className="h-10 w-10 text-foreground" />
        <h2 className="text-4xl text-foreground">
          {t('misc.serverUpgradeRequired')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('misc.serverUpgradeRequired')} -{' '}
          <span className="font-semibold">{server.name}</span> ({server.domain})
        </p>
        <p className="text-sm text-muted-foreground">
          <a
            href="https://github.com/colanode/colanode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {t('errors.github')}
          </a>
        </p>
      </div>
    </div>
  );
};
