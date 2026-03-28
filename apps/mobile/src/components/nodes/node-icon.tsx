import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { getIdType, IdType } from '@colanode/core';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { codeToEmoji } from '@colanode/mobile/lib/emoji-utils';

const NODE_ICONS: Record<string, { name: keyof typeof Feather.glyphMap; colorKey: 'primaryLight' | 'textSecondary' | 'textMuted'; staticColor?: string }> = {
  channel: { name: 'hash', colorKey: 'primaryLight', staticColor: '#a78bfa' },
  page: { name: 'file-text', colorKey: 'primaryLight' },
  folder: { name: 'folder', colorKey: 'primaryLight', staticColor: '#fbbf24' },
  database: { name: 'database', colorKey: 'primaryLight', staticColor: '#34d399' },
  file: { name: 'paperclip', colorKey: 'textSecondary' },
};

interface NodeIconProps {
  type: string;
  avatar?: string | null;
  size?: number;
}

const EmojiAvatar = ({ avatar, size }: { avatar: string; size: number }) => {
  const { data: emoji } = useQuery(
    { type: 'emoji.get.by.skin.id', id: avatar },
    { staleTime: Infinity }
  );

  const unified = emoji?.skins?.[0]?.unified;
  if (!unified) return null;

  return (
    <Text style={{ fontSize: size * 0.85, lineHeight: size * 1.1 }}>
      {codeToEmoji(unified)}
    </Text>
  );
};

const IconAvatar = ({ avatar, size }: { avatar: string; size: number }) => {
  const { colors } = useTheme();
  const { data: svg } = useQuery(
    { type: 'icon.svg.get', id: avatar },
    { staleTime: Infinity }
  );

  if (!svg) return null;

  return <SvgXml xml={svg} width={size} height={size} color={colors.text} />;
};

export const NodeIcon = ({ type, avatar, size = 22 }: NodeIconProps) => {
  const { colors } = useTheme();

  let content: React.ReactNode;

  if (avatar) {
    const avatarType = getIdType(avatar);
    if (avatarType === IdType.EmojiSkin) {
      content = <EmojiAvatar avatar={avatar} size={size} />;
    } else if (avatarType === IdType.Icon) {
      content = <IconAvatar avatar={avatar} size={size} />;
    }
  }

  if (!content) {
    const config = NODE_ICONS[type];
    content = config ? (
      <Feather name={config.name} size={size} color={config.staticColor ?? colors[config.colorKey]} />
    ) : (
      <Feather name="circle" size={size} color={colors.textMuted} />
    );
  }

  return (
    <View style={[styles.pill, { backgroundColor: colors.iconPillBackground }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
