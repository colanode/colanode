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
      className="p-1 ring-gray-100 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring"
      onClick={() => onIconClick(icon)}
    >
      <IconElement className="h-5 w-5" id={icon.id} />
    </button>
  );
};
