import { Palette } from 'lucide-react';

import { useI18n } from '@colanode/ui/contexts/i18n';

export const AppAppearanceSettingsTab = () => {
  const { t } = useI18n();

  return (
    <div className="flex items-center space-x-2">
      <Palette className="size-4" />
      <span>{t('common.appearance')}</span>
    </div>
  );
};
