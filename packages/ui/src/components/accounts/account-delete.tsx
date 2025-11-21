import { Button } from '@colanode/ui/components/ui/button';
import { useI18n } from '@colanode/ui/contexts/i18n';

export const AccountDelete = () => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold">{t('account.deleteAccount')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('account.deleteAccountDescription')}
        </p>
      </div>
      <div className="flex-shrink-0">
        <Button variant="destructive" className="" disabled>
          {t('common.delete')}
        </Button>
      </div>
    </div>
  );
};
