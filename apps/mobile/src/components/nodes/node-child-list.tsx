import Feather from '@expo/vector-icons/Feather';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LocalNode } from '@colanode/client/types/nodes';
import { NodeIcon } from '@colanode/mobile/components/nodes/node-icon';
import { EmptyState } from '@colanode/mobile/components/ui/empty-state';
import { SkeletonList } from '@colanode/mobile/components/ui/skeleton';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { getNodeDisplayName, NODE_TYPE_LABELS } from '@colanode/mobile/lib/node-utils';

interface NodeChildListProps {
  children: LocalNode[];
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  onOpenChild: (node: LocalNode) => void;
  onLongPressChild?: (node: LocalNode) => void;
  emptyTitle: string;
  emptySubtitle: string;
}

export const NodeChildList = ({
  children,
  isLoading,
  isRefetching,
  onRefresh,
  onOpenChild,
  onLongPressChild,
  emptyTitle,
  emptySubtitle,
}: NodeChildListProps) => {
  const { colors } = useTheme();

  return (
    <FlatList
      data={children}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [
            styles.childRow,
            pressed && { backgroundColor: colors.surface },
          ]}
          onPress={() => onOpenChild(item)}
          onLongPress={onLongPressChild ? () => onLongPressChild(item) : undefined}
          delayLongPress={500}
        >
          <View style={styles.iconContainer}>
            <NodeIcon type={item.type} size={20} />
          </View>
          <View style={styles.childInfo}>
            <Text style={[styles.childName, { color: colors.text }]} numberOfLines={1}>
              {getNodeDisplayName(item)}
            </Text>
            <Text style={[styles.childType, { color: colors.textMuted }]}>
              {NODE_TYPE_LABELS[item.type] ?? item.type}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.sheetHandle} />
        </Pressable>
      )}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: colors.listSeparator }]} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.textMuted}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <SkeletonList />
        ) : (
          <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
    gap: 2,
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
  },
  childType: {
    fontSize: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
});
