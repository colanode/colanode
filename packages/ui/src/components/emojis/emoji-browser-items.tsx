import { EmojiPickerItemsRow } from '@colanode/client/types';
import { EmojiPickerItem } from '@colanode/ui/components/emojis/emoji-picker-item';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface EmojiBrowserItemsProps {
  row: EmojiPickerItemsRow;
  style: React.CSSProperties;
}

export const EmojiBrowserItems = ({ row, style }: EmojiBrowserItemsProps) => {
  const emojiListQuery = useLiveQuery({
    type: 'emoji.list',
    category: row.category,
    page: row.page,
    count: row.count,
  });

  const emojis = emojiListQuery.data ?? [];
  return (
    <div className="flex flex-row gap-1" style={style}>
      {emojis.map((emoji) => (
        <EmojiPickerItem key={emoji.id} emoji={emoji} />
      ))}
    </div>
  );
};
