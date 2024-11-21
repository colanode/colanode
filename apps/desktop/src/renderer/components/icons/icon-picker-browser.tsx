import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { Icon, IconPickerRowData } from '@/shared/types/icons';
import { IconPickerBrowserRow } from '@/renderer/components/icons/icon-picker-browser-row';
import { useIconPicker } from '@/renderer/contexts/icon-picker';

const iconsPerRow = 10;

export const IconPickerBrowser = () => {
  const { data } = useIconPicker();
  const rowDataArray = React.useMemo<IconPickerRowData[]>(() => {
    const rows: IconPickerRowData[] = [];

    for (let i = 0; i < data.categories.length; i++) {
      const category = data.categories[i];

      if (!category) {
        continue;
      }

      // Add the category label
      rows.push({
        type: 'label',
        category: category.name,
      });

      const numIcons = category.icons.length;
      const numRowsInCategory = Math.ceil(numIcons / iconsPerRow);

      for (let rowIndex = 0; rowIndex < numRowsInCategory; rowIndex++) {
        const start = rowIndex * iconsPerRow;
        const end = start + iconsPerRow;
        const iconIds = category.icons.slice(start, end);
        const iconsInRow: Icon[] = [];
        for (const id of iconIds) {
          const icon = data.icons[id];
          if (!icon) {
            continue;
          }
          iconsInRow.push(icon);
        }

        rows.push({
          type: 'icon',
          icons: iconsInRow,
        });
      }
    }

    return rows;
  }, []);

  return (
    <AutoSizer>
      {({ width, height }: { width: number; height: number }) => (
        <FixedSizeList
          width={width}
          height={height}
          itemCount={rowDataArray.length}
          itemSize={30}
          className="List"
          itemData={{ rows: rowDataArray }}
        >
          {IconPickerBrowserRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};
