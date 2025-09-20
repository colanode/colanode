import { AppLayoutSingle } from '@colanode/ui/components/app/app-layout-single';
import { AppLayoutTabs } from '@colanode/ui/components/app/app-layout-tabs';
import { useApp } from '@colanode/ui/contexts/app';

export const AppLayout = () => {
  const app = useApp();

  return (
    <div className="w-screen min-w-screen h-full bg-background">
      {app.type === 'mobile' && <div className="h-10" />}
      {app.type === 'desktop' ? <AppLayoutTabs /> : <AppLayoutSingle />}
    </div>
  );
};
