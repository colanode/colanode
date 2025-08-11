import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';

import { IconPickerRowData } from '@colanode/client/types';
import { IconBrowserCategory } from '@colanode/ui/components/icons/icon-browser-category';
import { IconBrowserItems } from '@colanode/ui/components/icons/icon-browser-items';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

const ICONS_PER_ROW = 10;

export const IconBrowser = () => {
  const iconCategoryListQuery = useLiveQuery({
    type: 'icon.category.list',
  });

  const categories = iconCategoryListQuery.data ?? [];
  const rowDataArray = useMemo<IconPickerRowData[]>(() => {
    const rows: IconPickerRowData[] = [];

    for (const category of categories) {
      rows.push({
        type: 'category',
        category: category.name,
      });

      const numIcons = category.count;
      const numRowsInCategory = Math.ceil(numIcons / ICONS_PER_ROW);

      for (let i = 0; i < numRowsInCategory; i++) {
        rows.push({
          type: 'items',
          category: category.id,
          page: i,
          count: ICONS_PER_ROW,
        });
      }
    }

    return rows;
  }, [categories]);

  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: rowDataArray.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: `100%`,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const row = rowDataArray[virtualItem.index]!;
          const style: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          };

          if (row.type === 'category') {
            return (
              <IconBrowserCategory key={row.category} row={row} style={style} />
            );
          }

          const key = `${row.category}-${row.page}`;
          return <IconBrowserItems key={key} row={row} style={style} />;
        })}
      </div>
    </div>
  );
};
