import { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppService } from '@colanode/mobile/contexts/app-service';

interface UserAvatarProps {
  name: string;
  avatar: string | null;
  size?: number;
  style?: ViewStyle;
}

const COLORS = [
  '#7B8ABF',
  '#9B8BB8',
  '#B08DAF',
  '#C48B9A',
  '#C4887D',
  '#BF9A7A',
  '#C4A96E',
  '#A8B07A',
  '#6BC5A0',
  '#5BA8A0',
  '#6AA8BF',
  '#7A9EC4',
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
  const { appService } = useAppService();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (!avatar) {
      setAvatarUri(null);
      return;
    }

    const path = appService.path.avatar(avatar);
    appService.fs.exists(path).then((exists) => {
      if (exists) {
        setAvatarUri(path);
      } else {
        setAvatarUri(null);
      }
    });
  }, [avatar, appService]);

  const color = getColor(name);
  const initials = getInitials(name);
  const fontSize = size * 0.4;
  const borderRadius = size * 0.25;

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
