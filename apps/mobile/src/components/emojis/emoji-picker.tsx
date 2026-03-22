import Feather from '@expo/vector-icons/Feather';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useQuery } from '@colanode/mobile/hooks/use-query';
import { codeToEmoji } from '@colanode/mobile/lib/emoji-utils';
import { selectionChanged } from '@colanode/mobile/lib/haptics';

const QUICK_REACTIONS = [
  { code: '1f44d', label: 'thumbs up' },
  { code: '2764', label: 'heart' },
  { code: '1f602', label: 'laugh' },
  { code: '1f44f', label: 'clap' },
  { code: '1f389', label: 'party' },
  { code: '1f525', label: 'fire' },
];


interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ visible, onClose, onSelect }: EmojiPickerProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedCategory(null);
    }
  }, [visible]);

  const { data: categories } = useQuery({
    type: 'emoji.category.list',
  }, {
    enabled: visible,
  });

  const activeCategory = selectedCategory ?? categories?.[0]?.id ?? '';

  const { data: categoryEmojis } = useQuery(
    {
      type: 'emoji.list',
      category: activeCategory,
      page: 0,
      count: 200,
    },
    { enabled: visible && activeCategory.length > 0 }
  );

  const { data: searchResults } = useQuery(
    {
      type: 'emoji.search',
      query: searchQuery,
      count: 50,
    },
    { enabled: visible && searchQuery.length > 1 }
  );

  const emojis = searchQuery.length > 1 ? searchResults : categoryEmojis;

  const handleSelect = useCallback(
    (unified: string) => {
      selectionChanged();
      onSelect(codeToEmoji(unified));
      onClose();
      setSearchQuery('');
    },
    [onSelect, onClose]
  );

  const handleQuickReact = useCallback(
    (code: string) => {
      selectionChanged();
      onSelect(codeToEmoji(code));
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="60%">
      <View style={styles.header}>
        <View style={styles.quickRow}>
          {QUICK_REACTIONS.map((r) => (
            <Pressable
              key={r.code}
              style={({ pressed }) => [
                styles.quickEmoji,
                { backgroundColor: colors.surfaceHover },
                pressed && { backgroundColor: colors.border },
              ]}
              onPress={() => handleQuickReact(r.code)}
            >
              <Text style={styles.quickEmojiText}>{codeToEmoji(r.code)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.searchRow, { backgroundColor: colors.surfaceHover }]}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search emojis..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {!searchQuery && categories && categories.length > 0 && (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={styles.categoryBarContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryTab,
                { backgroundColor: colors.surfaceHover },
                item.id === activeCategory && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  { color: colors.textSecondary },
                  item.id === activeCategory && { color: colors.text },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      )}

      <FlatList
        data={emojis ?? []}
        keyExtractor={(item) => item.id}
        numColumns={8}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => {
          const unified = item.skins?.[0]?.unified;
          if (!unified) return null;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.emojiCell,
                pressed && { backgroundColor: colors.border },
              ]}
              onPress={() => handleSelect(unified)}
            >
              <Text style={styles.emojiText}>{codeToEmoji(unified)}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No emojis found
              </Text>
            ) : (
              <ActivityIndicator size="small" color={colors.textMuted} />
            )}
          </View>
        }
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickEmoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickEmojiText: {
    fontSize: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  categoryBar: {
    maxHeight: 36,
    marginTop: 8,
  },
  categoryBarContent: {
    paddingHorizontal: 12,
    gap: 4,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryTabText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  grid: {
    flex: 1,
    marginTop: 8,
  },
  gridContent: {
    paddingHorizontal: 8,
  },
  emojiCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 28,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
