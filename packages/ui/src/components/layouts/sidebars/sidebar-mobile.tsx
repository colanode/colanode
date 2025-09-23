import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useLocation } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Sidebar } from '@colanode/ui/components/layouts/sidebars/sidebar';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Sheet,
  SheetContent,
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
      </VisuallyHidden>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-9"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full p-0 border-0"
        aria-describedby="mobile-sidebar-description"
      >
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};
