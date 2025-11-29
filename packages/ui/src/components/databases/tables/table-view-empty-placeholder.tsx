import { useI18n } from '@colanode/ui/contexts/i18n';

export const TableViewEmptyPlaceholder = () => {
  const { t } = useI18n();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>{t('view.noRecords')}</p>
    </div>
  );
};
