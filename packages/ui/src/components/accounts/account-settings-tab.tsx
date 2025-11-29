import { TabItem } from '@colanode/ui/components/layouts/tabs/tab-item';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AccountSettingsTab = () => {
  const { t } = useI18n();

  return (
    <TabItem
      id="settings"
      avatar={defaultIcons.settings}
      name={t('account.accountSettings')}
    />
  );
};
