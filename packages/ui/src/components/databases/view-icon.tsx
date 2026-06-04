import {
  Calendar,
  Database,
  LayoutGrid,
  List,
  SquareKanban,
  Table,
} from 'lucide-react';

import { DatabaseViewLayout } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface ViewIconProps {
  id: string;
  name: string;
  avatar: string | null | undefined;
  layout: DatabaseViewLayout;
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

  if (layout === 'gallery') {
    return <LayoutGrid className={className} />;
  }

  if (layout === 'list') {
    return <List className={className} />;
  }

  return <Database className={className} />;
};
