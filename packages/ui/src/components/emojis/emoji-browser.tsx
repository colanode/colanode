import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';

import { EmojiPickerRowData } from '@colanode/client/types';
import { EmojiBrowserCategory } from '@colanode/ui/components/emojis/emoji-browser-category';
import { EmojiBrowserItems } from '@colanode/ui/components/emojis/emoji-browser-items';
import { useQuery } from '@colanode/ui/hooks/use-query';

const EMOJIS_PER_ROW = 10;

export const EmojiBrowser = () => {
  const emojiCategoryListQuery = useQuery({
    type: 'emoji.category.list',
  });

  const categories = emojiCategoryListQuery.data ?? [];
  const rowDataArray = useMemo<EmojiPickerRowData[]>(() => {
    const rows: EmojiPickerRowData[] = [];

    for (const category of categories) {
      rows.push({
        type: 'category',
        category: category.name,
      });

      const numEmojis = category.count;
      const numRowsInCategory = Math.ceil(numEmojis / EMOJIS_PER_ROW);

      for (let i = 0; i < numRowsInCategory; i++) {
        rows.push({
          type: 'items',
          category: category.id,
          page: i,
          count: EMOJIS_PER_ROW,
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
              <EmojiBrowserCategory
                row={row}
                style={style}
                key={row.category}
              />
            );
          }

          const key = `${row.category}-${row.page}`;
          return <EmojiBrowserItems row={row} style={style} key={key} />;
        })}
      </div>
    </div>
  );
};
