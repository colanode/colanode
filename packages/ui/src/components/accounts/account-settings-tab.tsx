import { Settings } from 'lucide-react';

import { useI18n } from '@colanode/ui/contexts/i18n';

export const AccountSettingsTab = () => {
  const { t } = useI18n();

  return (
    <div className="flex items-center space-x-2">
      <Settings className="size-4" />
      <span>{t('account.accountSettings')}</span>
    </div>
  );
};
