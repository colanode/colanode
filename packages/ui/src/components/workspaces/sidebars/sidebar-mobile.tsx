import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useLocation } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Sidebar } from '@colanode/ui/components/workspaces/sidebars/sidebar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@colanode/ui/components/ui/sheet';

export const SidebarMobile = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <VisuallyHidden>
        <SheetTitle>Sidebar</SheetTitle>
        <SheetDescription>Colanode sidebar for mobile devices</SheetDescription>
      </VisuallyHidden>
      <SheetTrigger asChild>
        <button className="px-2 outline-none" aria-label="Open sidebar">
          <Menu className="size-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[90%] max-w-sm p-0 border-0"
        showCloseButton={false}
        aria-describedby="mobile-sidebar-description"
      >
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};
