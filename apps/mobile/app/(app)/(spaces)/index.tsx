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

  const { data: spaces, isLoading, refetch, isRefetching } = useNodeListQuery(
    userId,
    [{ field: ['type'], operator: 'eq', value: 'space' }],
    [{ field: ['createdAt'], direction: 'desc', nulls: 'last' }]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Spaces</Text>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push('/(app)/(spaces)/create-space')}
        >
          <Text style={[styles.addButtonText, { color: colors.text }]}>+</Text>
        </Pressable>
      </View>
      <FlatList
        data={(spaces as LocalSpaceNode[] | undefined) ?? []}
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
              subtitle="Tap + to create your first space"
            />
          ) : null
        }
      />
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 22,
    fontWeight: '400',
    marginTop: -1,
  },
  list: {
    flexGrow: 1,
  },
});
