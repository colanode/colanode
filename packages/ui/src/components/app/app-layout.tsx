import { match } from 'ts-pattern';

import { AppType } from '@colanode/client/types';
import { LayoutDesktop } from '@colanode/ui/components/layouts/layout-desktop';
import { LayoutMobile } from '@colanode/ui/components/layouts/layout-mobile';
import { LayoutWeb } from '@colanode/ui/components/layouts/layout-web';

interface AppLayoutProps {
  type: AppType;
}

export const AppLayout = ({ type }: AppLayoutProps) => {
  return (
    <div className="h-[100dvh] w-[100dvw] bg-background text-foreground">
      {match(type)
        .with('desktop', () => <LayoutDesktop />)
        .with('mobile', () => <LayoutMobile />)
        .with('web', () => <LayoutWeb />)
        .exhaustive()}
    </div>
  );
};
