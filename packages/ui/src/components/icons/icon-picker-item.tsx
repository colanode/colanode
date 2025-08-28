import { Icon } from '@colanode/client/types';
import { IconElement } from '@colanode/ui/components/icons/icon-element';
import { useIconPicker } from '@colanode/ui/contexts/icon-picker';

interface IconPickerItemProps {
  icon: Icon;
}

export const IconPickerItem = ({ icon }: IconPickerItemProps) => {
  const { onPick: onIconClick } = useIconPicker();

  return (
    <button
      className="p-1 ring-border transition-colors duration-100 ease-in-out hover:bg-accent focus:border-border focus:outline-none focus:ring cursor-pointer"
      onClick={() => onIconClick(icon)}
    >
      <IconElement className="h-5 w-5" id={icon.id} />
    </button>
  );
};
