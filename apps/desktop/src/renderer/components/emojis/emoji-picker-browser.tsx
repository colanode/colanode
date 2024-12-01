import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { EmojiPickerBrowserRow } from '@/renderer/components/emojis/emoji-picker-browser-row';
import { useEmojiPicker } from '@/renderer/contexts/emoji-picker';
import { Emoji, EmojiPickerRowData } from '@/shared/types/emojis';

const emojisPerRow = 10;

export const EmojiPickerBrowser = () => {
  const { data } = useEmojiPicker();

  const rowDataArray = React.useMemo<EmojiPickerRowData[]>(() => {
    const rows: EmojiPickerRowData[] = [];

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

      const numEmojis = category.emojis.length;
      const numRowsInCategory = Math.ceil(numEmojis / emojisPerRow);

      for (let rowIndex = 0; rowIndex < numRowsInCategory; rowIndex++) {
        const start = rowIndex * emojisPerRow;
        const end = start + emojisPerRow;
        const emojisIds = category.emojis.slice(start, end);
        const emojisInRow: Emoji[] = [];
        for (const id of emojisIds) {
          const emoji = data.emojis[id];
          if (!emoji) {
            continue;
          }
          emojisInRow.push(emoji);
        }

        rows.push({
          type: 'emoji',
          emojis: emojisInRow,
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
          {EmojiPickerBrowserRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};
