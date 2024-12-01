import * as React from 'react';

import { cn } from '@/shared/lib/utils';

const Header = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      'flex h-16 w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear',
      className
    )}
    {...props}
  />
));
Header.displayName = 'Header';

export { Header };
