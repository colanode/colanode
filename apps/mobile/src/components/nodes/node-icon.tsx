import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

const NODE_ICONS: Record<string, { name: keyof typeof Feather.glyphMap; colorKey: 'primaryLight' | 'textSecondary' | 'textMuted'; staticColor?: string }> = {
  channel: { name: 'hash', colorKey: 'primaryLight', staticColor: '#a78bfa' },
  page: { name: 'file-text', colorKey: 'primaryLight' },
  folder: { name: 'folder', colorKey: 'primaryLight', staticColor: '#fbbf24' },
  database: { name: 'database', colorKey: 'primaryLight', staticColor: '#34d399' },
  file: { name: 'paperclip', colorKey: 'textSecondary' },
};

interface NodeIconProps {
  type: string;
  size?: number;
}

export const NodeIcon = ({ type, size = 22 }: NodeIconProps) => {
  const { colors } = useTheme();
  const config = NODE_ICONS[type];

  const icon = config ? (
    <Feather name={config.name} size={size} color={config.staticColor ?? colors[config.colorKey]} />
  ) : (
    <Feather name="circle" size={size} color={colors.textMuted} />
  );

  return (
    <View style={[styles.pill, { backgroundColor: colors.iconPillBackground }]}>
      {icon}
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
