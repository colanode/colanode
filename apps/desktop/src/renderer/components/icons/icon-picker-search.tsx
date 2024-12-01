import React from 'react';

import { IconPickerItem } from '@/renderer/components/icons/icon-picker-item';
import { useIconPicker } from '@/renderer/contexts/icon-picker';
import { searchIcons } from '@/shared/lib/icons';

interface IconPickerSearchProps {
  query: string;
}

export const IconPickerSearch = ({ query }: IconPickerSearchProps) => {
  const { data } = useIconPicker();

  const filteredIcons = React.useMemo(() => {
    return searchIcons(query, data);
  }, [query]);

  return (
    <div className="grid w-full min-w-full grid-cols-10 gap-1">
      <div className="col-span-full flex items-center py-1 pl-1 text-sm text-muted-foreground">
        <p>Search results for &quot;{query}&quot;</p>
      </div>
      {filteredIcons.map((icon) => (
        <IconPickerItem key={icon.id} icon={icon} />
      ))}
    </div>
  );
};
