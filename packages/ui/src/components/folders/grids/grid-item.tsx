import { useRef } from 'react';

import { useFolder } from '@colanode/ui/contexts/folder';
import { cn } from '@colanode/ui/lib/utils';

interface GridItemProps {
  id: string;
  children: React.ReactNode;
}

export const GridItem = ({ id, children }: GridItemProps) => {
  const folder = useFolder();

  const ref = useRef<HTMLDivElement>(null);
  const selected = false;

  return (
    <div
      ref={ref}
      className={cn(
        'flex cursor-pointer select-none flex-col items-center gap-2 p-2',
        selected ? 'bg-blue-100' : 'hover:bg-blue-50'
      )}
      onClick={(event) => folder.onClick(event, id)}
      onDoubleClick={(event) => folder.onDoubleClick(event, id)}
    >
      {children}
    </div>
  );
};
