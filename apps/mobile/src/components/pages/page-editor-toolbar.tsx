import Feather from '@expo/vector-icons/Feather';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';
import { blurPageWebView } from '@colanode/mobile/components/pages/page-webview';

interface PageEditorToolbarProps {
  onPlusPress: () => void;
}

export const PageEditorToolbar = ({
  onPlusPress,
}: PageEditorToolbarProps) => {
  const { colors } = useTheme();

  const handleDismiss = () => {
    blurPageWebView();
    Keyboard.dismiss();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onPlusPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Feather name="plus" size={22} color={colors.textSecondary} />
      </Pressable>
      <View style={styles.spacer} />
      <Pressable
        onPress={handleDismiss}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Feather name="chevron-down" size={22} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    padding: 8,
  },
  pressed: {
    opacity: 0.5,
  },
  spacer: {
    flex: 1,
  },
});
