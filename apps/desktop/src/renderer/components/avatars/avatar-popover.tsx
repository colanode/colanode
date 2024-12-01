import React from 'react';

import { AvatarPicker } from '@/renderer/components/avatars/avatar-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';

interface AvatarPopoverProps {
  onPick: (avatar: string) => void;
  children: React.ReactNode;
}

export const AvatarPopover = ({ onPick, children }: AvatarPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-max p-0">
        <AvatarPicker onPick={onPick} />
      </PopoverContent>
    </Popover>
  );
};
