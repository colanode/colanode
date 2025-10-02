import { Container } from '@colanode/ui/components/workspaces/containers/container';
import { SidebarDesktop } from '@colanode/ui/components/workspaces/sidebars/sidebar-desktop';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';

export const WorkspaceLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="w-full h-full flex">
      {!isMobile && <SidebarDesktop />}
      <section className="min-w-0 flex-1">
        <Container />
      </section>
    </div>
  );
};
