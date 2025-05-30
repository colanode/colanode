import { Calendar, Database, SquareKanban, Table } from 'lucide-react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface ViewIconProps {
  id: string;
  name: string;
  avatar: string | null | undefined;
  layout: 'table' | 'board' | 'calendar';
  className?: string;
}

export const ViewIcon = ({
  id,
  name,
  avatar,
  layout,
  className,
}: ViewIconProps) => {
  if (avatar) {
    return <Avatar id={id} name={name} avatar={avatar} className={className} />;
  }

  if (layout === 'table') {
    return <Table className={className} />;
  }

  if (layout === 'calendar') {
    return <Calendar className={className} />;
  }

  if (layout === 'board') {
    return <SquareKanban className={className} />;
  }

  return <Database className={className} />;
};
