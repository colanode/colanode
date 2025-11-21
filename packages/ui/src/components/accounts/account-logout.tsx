import { toast } from 'sonner';

import { Button } from '@colanode/ui/components/ui/button';
import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const AccountLogout = () => {
  const { t } = useI18n();
  const account = useAccount();
  const { mutate, isPending } = useMutation();

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('common.logout')}
            </h2>
            <Separator className="mt-3" />
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">{t('auth.signOut')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('auth.signOutDescription')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="destructive"
                disabled={isPending}
                className="cursor-pointer"
                onClick={async () => {
                  mutate({
                    input: {
                      type: 'account.logout',
                      accountId: account.id,
                    },
                    onError(error) {
                      toast.error(error.message);
                    },
                  });
                }}
              >
                {isPending && <Spinner className="mr-1" />}
                {t('common.logout')}
              </Button>
            </div>
          </div>
        </div>
      </ContainerBody>
    </Container>
  );
};
