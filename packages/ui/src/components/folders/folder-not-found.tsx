import { BadgeAlert } from 'lucide-react';

import { useI18n } from '@colanode/ui/contexts/i18n';

export const FolderNotFound = () => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <BadgeAlert className="size-12 mb-4" />
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('status.notFound')}
      </h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        {t('channel.channelNotFoundDescription')}
      </p>
    </div>
  );
};
