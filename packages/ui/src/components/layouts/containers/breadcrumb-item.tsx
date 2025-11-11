import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface BreadcrumbItemProps {
  id: string;
  name: string;
  avatar?: string | null;
}

export const BreadcrumbItem = ({ id, name, avatar }: BreadcrumbItemProps) => {
  return (
    <div className="text-muted-foreground flex items-center space-x-2 hover:text-foreground cursor-pointer text-sm">
      <Avatar id={id} avatar={avatar} name={name} className="size-4" />
      <span>{name}</span>
    </div>
  );
};
