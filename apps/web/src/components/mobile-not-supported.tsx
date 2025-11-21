import { Smartphone } from 'lucide-react';

import { I18nProvider, useI18n } from '@colanode/ui/contexts/i18n';

const MobileNotSupportedContent = () => {
  const { t } = useI18n();

  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center w-128">
        <Smartphone className="h-10 w-10 text-gray-800" />
        <h2 className="text-4xl text-gray-800">
          {t('errors.mobileNotSupported')}
        </h2>
        <p className="text-sm text-gray-500">
          {t('errors.mobileNotSupportedTitle')}
        </p>
        <p className="text-sm text-gray-500">
          {t('errors.mobileNotSupportedDescription')}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          {t('errors.mobileNotSupportedFooter')}
        </p>
      </div>
    </div>
  );
};

export const MobileNotSupported = () => {
  return (
    <I18nProvider>
      <MobileNotSupportedContent />
    </I18nProvider>
  );
};
