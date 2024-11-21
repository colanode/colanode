import React from 'react';
import { IconPickerRowData } from '@/shared/types/icons';
import { IconPickerItem } from '@/renderer/components/icons/icon-picker-item';

interface IconPickerBrowserRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    rows: IconPickerRowData[];
  };
}

export const IconPickerBrowserRow = ({
  index,
  style,
  data,
}: IconPickerBrowserRowProps) => {
  const rowData = data.rows[index];

  if (!rowData) {
    return null;
  }

  if (rowData.type === 'label') {
    return (
      <div
        style={style}
        className="flex items-center pl-1 text-sm text-muted-foreground"
      >
        <p>{rowData.category}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-1" style={style}>
      {rowData.icons.map((icon) => (
        <IconPickerItem key={icon.id} icon={icon} />
      ))}
    </div>
  );
};
