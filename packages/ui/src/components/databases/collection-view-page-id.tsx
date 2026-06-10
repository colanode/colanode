import { toast } from 'sonner';

import { cn } from '@colanode/ui/lib/utils';

interface CollectionViewPageIdProps {
  pageId: string;
  className?: string;
}

export const CollectionViewPageId = ({
  pageId,
  className,
}: CollectionViewPageIdProps) => {
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(pageId);
      toast.success('Page ID copied');
    } catch {
      toast.error('Failed to copy page ID');
    }
  };

  return (
    <button
      type="button"
      title={pageId}
      onClick={(event) => {
        event.stopPropagation();
        void copyId();
      }}
      className={cn(
        'cursor-pointer truncate font-mono text-xs text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {pageId}
    </button>
  );
};
