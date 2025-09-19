interface WorkspaceSidebarHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const WorkspaceSidebarHeader = ({
  title,
  actions,
}: WorkspaceSidebarHeaderProps) => {
  return (
    <div className="flex items-center justify-between h-12 pl-2 pr-1 app-drag-region">
      <p className="font-bold text-muted-foreground flex-grow app-no-drag-region">
        {title}
      </p>
      {actions && (
        <div className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar:opacity-100 flex items-center justify-center app-no-drag-region">
          {actions}
        </div>
      )}
    </div>
  );
};
