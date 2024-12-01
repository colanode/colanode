import { LayoutMain } from '@/renderer/components/layouts/layout-main';
import { LayoutModal } from '@/renderer/components/layouts/layout-modal';
import { LayoutSidebar } from '@/renderer/components/layouts/layout-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@/renderer/components/ui/sidebar';

interface LayoutProps {
  main?: string | null;
  modal?: string | null;
}

export const Layout = ({ main, modal }: LayoutProps) => {
  return (
    <SidebarProvider>
      <LayoutSidebar />
      <SidebarInset>
        <main className="h-full max-h-screen w-full min-w-128 flex-grow overflow-hidden bg-white">
          {main && <LayoutMain nodeId={main} />}
        </main>
        {modal && <LayoutModal nodeId={modal} />}
      </SidebarInset>
    </SidebarProvider>
  );
};
