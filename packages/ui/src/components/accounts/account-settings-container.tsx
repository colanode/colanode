import { AccountDelete } from '@colanode/ui/components/accounts/account-delete';
import { AccountSettingsBreadcrumb } from '@colanode/ui/components/accounts/account-settings-breadcrumb';
import { AccountUpdate } from '@colanode/ui/components/accounts/account-update';
import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useI18n } from '@colanode/ui/contexts/i18n';

export const AccountSettingsContainer = () => {
  const { t } = useI18n();

  return (
    <Container type="full" breadcrumb={<AccountSettingsBreadcrumb />}>
      <div className="max-w-4xl space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('common.general')}
            </h2>
            <Separator className="mt-3" />
          </div>
          <AccountUpdate />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('account.dangerZone')}
            </h2>
            <Separator className="mt-3" />
          </div>
          <AccountDelete />
        </div>
      </div>
    </Container>
  );
};
