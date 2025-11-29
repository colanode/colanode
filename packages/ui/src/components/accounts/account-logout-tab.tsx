import { LogOut } from 'lucide-react';

import { useI18n } from '@colanode/ui/contexts/i18n';

export const AccountLogoutTab = () => {
  const { t } = useI18n();

  return (
    <div className="flex items-center space-x-2">
      <LogOut className="size-4" />
      <span>{t('common.logout')}</span>
    </div>
  );
};
