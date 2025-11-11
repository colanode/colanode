import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface TabItemProps {
  id: string;
  name: string;
  avatar?: string | null;
}

export const TabItem = ({ id, name, avatar }: TabItemProps) => {
  return (
    <div className="flex items-center space-x-2 cursor-pointer text-sm">
      <Avatar id={id} avatar={avatar} name={name} className="size-4" />
      <span>{name}</span>
    </div>
  );
};
