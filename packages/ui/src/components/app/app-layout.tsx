import { AppLayoutSingle } from '@colanode/ui/components/app/app-layout-single';
import { AppLayoutTabs } from '@colanode/ui/components/app/app-layout-tabs';
import { useApp } from '@colanode/ui/contexts/app';

export const AppLayout = () => {
  const app = useApp();

  return (
    <div className="h-[100dvh] w-[100dvw] bg-background text-foreground">
      {app.type === 'desktop' ? <AppLayoutTabs /> : <AppLayoutSingle />}
    </div>
  );
};
