import { Calendar, Database, SquareKanban, Table } from 'lucide-react';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface ViewIconProps {
  id: string;
  name: string;
  avatar: string | null;
  type: 'table' | 'board' | 'calendar';
  className?: string;
}

export const ViewIcon = ({
  id,
  name,
  avatar,
  type,
  className,
}: ViewIconProps) => {
  if (avatar) {
    return <Avatar id={id} name={name} avatar={avatar} className={className} />;
  }

  if (type === 'table') {
    return <Table className={className} />;
  }

  if (type === 'calendar') {
    return <Calendar className={className} />;
  }

  if (type === 'board') {
    return <SquareKanban className={className} />;
  }

  return <Database className={className} />;
};
