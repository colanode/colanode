import { useNavigate } from '@tanstack/react-router';
import { BadgeAlert } from 'lucide-react';

import { Button } from '@colanode/ui/components/ui/button';
import { useI18n } from '@colanode/ui/contexts/i18n';

interface ServerNotFoundProps {
  domain: string;
}

export const ServerNotFound = ({ domain }: ServerNotFoundProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <BadgeAlert className="size-12 mb-4 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        {t('status.notFound')}
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {t('channel.channelNotFoundDescription')}
      </p>
      <Button
        onClick={() => {
          navigate({
            to: '/',
            replace: true,
          });
        }}
      >
        {t('auth.backToWorkspace')}
      </Button>
    </div>
  );
};
