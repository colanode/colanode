import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';

interface UserAvatarProps {
  name: string;
  avatar: string | null;
  size?: number;
  style?: ViewStyle;
}

const COLORS = [
  '#5B6EAA',
  '#8B6BAA',
  '#A06B96',
  '#B5677A',
  '#B56558',
  '#AA7D55',
  '#AA9245',
  '#85A058',
  '#45B585',
  '#3FA08A',
  '#4A8AAA',
  '#5580AA',
];

const getColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length]!;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return (name[0] ?? '?').toUpperCase();
};

export const UserAvatar = ({
  name,
  avatar,
  size = 40,
  style,
}: UserAvatarProps) => {
  const { accountId } = useWorkspace();
  const { data: resolvedAvatar } = useLiveQuery(
    {
      type: 'avatar.get',
      accountId,
      avatarId: avatar ?? '',
    },
    { enabled: !!avatar }
  );

  const color = getColor(name);
  const initials = getInitials(name);
  const fontSize = size * 0.4;
  const borderRadius = size * 0.25;
  const avatarUri = resolvedAvatar?.url ?? null;

  if (avatarUri) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius,
          },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
