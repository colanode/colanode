import { MonitorOff } from 'lucide-react';

import { I18nProvider, useI18n } from '@colanode/ui/contexts/i18n';

const BrowserNotSupportedContent = () => {
  const { t } = useI18n();

  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center w-128">
        <MonitorOff className="h-10 w-10 text-gray-800" />
        <h2 className="text-4xl text-gray-800">
          {t('errors.browserNotSupported')}
        </h2>
        <p className="text-sm text-gray-500">
          {t('errors.browserNotSupportedDescription')}
        </p>
        <p className="text-sm text-gray-500">
          {t('errors.browserNotSupportedHttps')}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          {t('errors.browserNotSupportedAlternative')}{' '}
          <a
            href="https://colanode.com/downloads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {t('errors.desktopApp')}
          </a>{' '}
          {t('errors.insteadOrTryAnother')}{' '}
          <a
            href="https://github.com/colanode/colanode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {t('errors.github')}
          </a>
        </p>
      </div>
    </div>
  );
};

export const BrowserNotSupported = () => {
  return (
    <I18nProvider>
      <BrowserNotSupportedContent />
    </I18nProvider>
  );
};
