import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface PageEditorToolbarProps {
  onAddBlock: () => void;
}

export const PageEditorToolbar = ({ onAddBlock }: PageEditorToolbarProps) => {
  const { colors } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!keyboardVisible) return null;

  return (
    <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Pressable
        onPress={onAddBlock}
        hitSlop={6}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Feather name="plus" size={22} color={colors.textSecondary} />
      </Pressable>
      <View style={styles.spacer} />
      <Pressable
        onPress={() => Keyboard.dismiss()}
        hitSlop={6}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Feather name="chevron-down" size={22} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  button: {
    padding: 6,
  },
  pressed: {
    opacity: 0.5,
  },
  spacer: {
    flex: 1,
  },
});
