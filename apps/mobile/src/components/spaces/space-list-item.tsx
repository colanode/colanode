import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LocalSpaceNode } from '@colanode/client/types/nodes';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { useTheme } from '@colanode/mobile/contexts/theme';

interface SpaceListItemProps {
  space: LocalSpaceNode;
  onPress: () => void;
}

export const SpaceListItem = ({ space, onPress }: SpaceListItemProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <UserAvatar
        name={space.name}
        avatar={space.avatar ?? null}
        size={40}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {space.name}
        </Text>
        {space.description && (
          <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={1}>
            {space.description}
          </Text>
        )}
      </View>
      <Text style={[styles.chevron, { color: colors.sheetHandle }]}>{'\u203A'}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 24,
  },
});
