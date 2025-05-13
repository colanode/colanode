import { EmojiPickerItemsRow } from '@colanode/client/types';

import { useQuery } from '@/renderer/hooks/use-query';
import { EmojiPickerItem } from '@/renderer/components/emojis/emoji-picker-item';

interface EmojiBrowserItemsProps {
  row: EmojiPickerItemsRow;
  style: React.CSSProperties;
}

export const EmojiBrowserItems = ({ row, style }: EmojiBrowserItemsProps) => {
  const { data } = useQuery({
    type: 'emoji_list',
    category: row.category,
    page: row.page,
    count: row.count,
  });

  const emojis = data ?? [];
  return (
    <div className="flex flex-row gap-1" style={style}>
      {emojis.map((emoji) => (
        <EmojiPickerItem key={emoji.id} emoji={emoji} />
      ))}
    </div>
  );
};
