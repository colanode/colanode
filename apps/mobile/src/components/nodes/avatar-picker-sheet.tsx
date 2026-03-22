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

import { IconPicker } from '@colanode/mobile/components/icons/icon-picker';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useQuery } from '@colanode/mobile/hooks/use-query';
import { codeToEmoji } from '@colanode/mobile/lib/emoji-utils';

type Tab = 'emojis' | 'icons';

interface AvatarPickerSheetProps {
  currentAvatar?: string | null;
  onSelect: (avatarId: string | null) => void;
  onBack: () => void;
}

export const AvatarPickerSheet = ({
  currentAvatar,
  onSelect,
  onBack,
}: AvatarPickerSheetProps) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('emojis');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery('');
    setSelectedCategory(null);
  }, [activeTab]);

  const { data: categories } = useQuery({
    type: 'emoji.category.list',
  });

  const activeCategory = selectedCategory ?? categories?.[0]?.id ?? '';

  const { data: categoryEmojis } = useQuery(
    {
      type: 'emoji.list',
      category: activeCategory,
      page: 0,
      count: 200,
    },
    { enabled: activeTab === 'emojis' && activeCategory.length > 0 && searchQuery.length < 2 }
  );

  const { data: searchResults } = useQuery(
    {
      type: 'emoji.search',
      query: searchQuery,
      count: 50,
    },
    { enabled: activeTab === 'emojis' && searchQuery.length > 1 }
  );

  const emojis = searchQuery.length > 1 ? searchResults : categoryEmojis;

  const handleEmojiSelect = useCallback(
    (skinId: string) => {
      onSelect(skinId);
    },
    [onSelect]
  );

  const handleIconSelect = useCallback(
    (iconId: string) => {
      onSelect(iconId);
    },
    [onSelect]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Choose icon</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[
            styles.tab,
            { backgroundColor: colors.surfaceHover },
            activeTab === 'emojis' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('emojis')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textSecondary },
              activeTab === 'emojis' && { color: colors.text },
            ]}
          >
            Emojis
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            { backgroundColor: colors.surfaceHover },
            activeTab === 'icons' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('icons')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textSecondary },
              activeTab === 'icons' && { color: colors.text },
            ]}
          >
            Icons
          </Text>
        </Pressable>
      </View>

      {currentAvatar && (
        <Pressable
          style={({ pressed }) => [
            styles.removeButton,
            { borderColor: colors.border },
            pressed && { backgroundColor: colors.surfaceHover },
          ]}
          onPress={() => onSelect(null)}
        >
          <Feather name="x" size={14} color={colors.textSecondary} />
          <Text style={[styles.removeText, { color: colors.textSecondary }]}>
            Remove icon
          </Text>
        </Pressable>
      )}

      {activeTab === 'emojis' ? (
        <View style={styles.pickerContent}>
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
              const skin = item.skins?.[0];
              if (!skin?.unified) return null;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.emojiCell,
                    pressed && { backgroundColor: colors.border },
                  ]}
                  onPress={() => handleEmojiSelect(skin.id)}
                >
                  <Text style={styles.emojiText}>{codeToEmoji(skin.unified)}</Text>
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
        </View>
      ) : (
        <IconPicker onSelect={handleIconSelect} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    width: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  removeText: {
    fontSize: 13,
  },
  pickerContent: {
    flex: 1,
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
