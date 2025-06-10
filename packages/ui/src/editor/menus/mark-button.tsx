import { cn } from '@colanode/ui/lib/utils';

interface MarkButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

export const MarkButton = ({
  isActive,
  onClick,
  icon: Icon,
}: MarkButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md cursor-pointer hover:bg-gray-100',
        isActive ? 'bg-gray-100' : 'bg-white'
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
    </button>
  );
};
