import Feather from '@expo/vector-icons/Feather';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

import { useTheme } from '@colanode/mobile/contexts/theme';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface IconPickerProps {
  onSelect: (iconId: string) => void;
}

const IconCell = ({
  iconId,
  size,
  onPress,
}: {
  iconId: string;
  size: number;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const { data: svg } = useQuery(
    { type: 'icon.svg.get', id: iconId },
    { staleTime: Infinity }
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconCell,
        pressed && { backgroundColor: colors.border },
      ]}
      onPress={onPress}
    >
      {svg ? (
        <SvgXml xml={svg} width={size} height={size} color={colors.text} />
      ) : (
        <View style={{ width: size, height: size }} />
      )}
    </Pressable>
  );
};

export const IconPicker = ({ onSelect }: IconPickerProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    type: 'icon.category.list',
  });

  const activeCategory = selectedCategory ?? categories?.[0]?.id ?? '';

  const { data: categoryIcons } = useQuery(
    {
      type: 'icon.list',
      category: activeCategory,
      page: 0,
      count: 200,
    },
    { enabled: activeCategory.length > 0 && searchQuery.length < 2 }
  );

  const { data: searchResults } = useQuery(
    {
      type: 'icon.search',
      query: searchQuery,
      count: 50,
    },
    { enabled: searchQuery.length > 1 }
  );

  const icons = searchQuery.length > 1 ? searchResults : categoryIcons;

  const handleSelect = useCallback(
    (iconId: string) => {
      onSelect(iconId);
    },
    [onSelect]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceHover }]}>
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search icons..."
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
        data={icons ?? []}
        keyExtractor={(item) => item.id}
        numColumns={7}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <IconCell
            iconId={item.id}
            size={24}
            onPress={() => handleSelect(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No icons found
              </Text>
            ) : (
              <ActivityIndicator size="small" color={colors.textMuted} />
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  iconCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
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
