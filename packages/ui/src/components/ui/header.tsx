import * as React from 'react';

import { cn } from '@colanode/ui/lib/utils';

const Header = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <div className="p-2">
    <header
      ref={ref}
      className={cn(
        'flex h-10 w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear',
        className
      )}
      {...props}
    />
  </div>
));
Header.displayName = 'Header';

export { Header };
