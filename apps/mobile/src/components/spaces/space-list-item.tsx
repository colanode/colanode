import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LocalSpaceNode } from '@colanode/client/types/nodes';
import { getIdType, IdType } from '@colanode/core';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { NodeIcon } from '@colanode/mobile/components/nodes/node-icon';
import { useTheme } from '@colanode/mobile/contexts/theme';

interface SpaceListItemProps {
  space: LocalSpaceNode;
  onPress: () => void;
}

const SpaceAvatar = ({ space }: { space: LocalSpaceNode }) => {
  const avatar = space.avatar ?? null;

  if (avatar) {
    const avatarType = getIdType(avatar);
    if (avatarType === IdType.EmojiSkin || avatarType === IdType.Icon) {
      return <NodeIcon type="space" avatar={avatar} size={24} />;
    }
  }

  return (
    <UserAvatar
      name={space.name}
      avatar={avatar}
      size={40}
    />
  );
};

export const SpaceListItem = memo(({ space, onPress }: SpaceListItemProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { backgroundColor: colors.surface }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Space: ${space.name}`}
    >
      <SpaceAvatar space={space} />
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
});
SpaceListItem.displayName = 'SpaceListItem';

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
