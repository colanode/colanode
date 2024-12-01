import { LoaderCircle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: string | number | undefined;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, ...props }, ref) => (
    <LoaderCircle
      className={cn('size-4 animate-spin', className)}
      ref={ref}
      {...props}
    />
  )
);
Spinner.displayName = 'Spinner';

export { Spinner };
