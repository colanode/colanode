import { IconPickerItemsRow } from '@colanode/client/types';
import { IconPickerItem } from '@colanode/ui/components/icons/icon-picker-item';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface IconBrowserItemsProps {
  row: IconPickerItemsRow;
  style: React.CSSProperties;
}

export const IconBrowserItems = ({ row, style }: IconBrowserItemsProps) => {
  const iconListQuery = useLiveQuery({
    type: 'icon.list',
    category: row.category,
    page: row.page,
    count: row.count,
  });

  const icons = iconListQuery.data ?? [];
  return (
    <div className="flex flex-row gap-1" style={style}>
      {icons.map((icon) => (
        <IconPickerItem key={icon.id} icon={icon} />
      ))}
    </div>
  );
};
