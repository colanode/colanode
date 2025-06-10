import { AvatarPicker } from '@colanode/ui/components/avatars/avatar-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';

interface AvatarPopoverProps {
  onPick: (avatar: string) => void;
  children: React.ReactNode;
}

export const AvatarPopover = ({ onPick, children }: AvatarPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-max p-0"
        onWheel={(e) => e.stopPropagation()}
      >
        <AvatarPicker onPick={onPick} />
      </PopoverContent>
    </Popover>
  );
};
