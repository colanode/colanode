import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LocalSpaceNode } from '@colanode/client/types/nodes';
import { SpaceListItem } from '@colanode/mobile/components/spaces/space-list-item';
import { EmptyState } from '@colanode/mobile/components/ui/empty-state';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

export default function SpacesScreen() {
  const router = useRouter();
  const { userId } = useWorkspace();
  const { colors } = useTheme();

  const { data: spaces, isLoading, refetch, isRefetching } = useNodeListQuery<LocalSpaceNode>(
    userId,
    [{ field: ['type'], operator: 'eq', value: 'space' }],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Spaces</Text>
      </View>
      <FlatList
        data={spaces ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SpaceListItem
            space={item}
            onPress={() =>
              router.push({
                pathname: '/(app)/(spaces)/space/[spaceId]',
                params: { spaceId: item.id },
              })
            }
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.listSeparator }]} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No spaces yet"
              subtitle="Tap the button below to create your first space"
            />
          ) : null
        }
        ListFooterComponent={
          spaces && spaces.length > 0 && spaces.length <= 3 ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Create spaces to organize channels, pages, and files
            </Text>
          ) : null
        }
      />
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.surface },
          pressed && styles.fabPressed,
        ]}
        onPress={() => router.push('/(app)/(spaces)/create-space')}
      >
        <Feather name="plus" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  list: {
    flexGrow: 1,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
