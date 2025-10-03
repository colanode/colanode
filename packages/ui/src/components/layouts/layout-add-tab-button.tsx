import { Plus } from 'lucide-react';

interface LayoutAddTabButtonProps {
  onAddTab: () => void;
}

export const LayoutAddTabButton = ({ onAddTab }: LayoutAddTabButtonProps) => {
  return (
    <button
      onClick={onAddTab}
      className="flex items-center justify-center w-10 h-10 bg-sidebar hover:bg-sidebar-accent transition-all duration-200 app-no-drag-region flex-shrink-0 border-l border-border/30 hover:border-border/60 rounded-tl-md"
      title="Add new tab"
    >
      <Plus className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
    </button>
  );
};
