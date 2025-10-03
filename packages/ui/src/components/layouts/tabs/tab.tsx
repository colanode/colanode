import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface TabProps {
  id: string;
  avatar?: string | null;
  name: string;
}

export const Tab = ({ id, avatar, name }: TabProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar id={id} avatar={avatar} name={name} className="size-4" />
      <span>{name}</span>
    </div>
  );
};
