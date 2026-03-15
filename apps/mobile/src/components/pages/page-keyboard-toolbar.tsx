import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface PageKeyboardToolbarProps {
  onAddBlock: () => void;
  onDismissKeyboard: () => void;
}

export const PageKeyboardToolbar = ({
  onAddBlock,
  onDismissKeyboard,
}: PageKeyboardToolbarProps) => {
  const { colors } = useTheme();

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
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.6 },
        ]}
        onPress={onAddBlock}
        hitSlop={8}
      >
        <Feather name="plus" size={22} color={colors.text} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.6 },
        ]}
        onPress={onDismissKeyboard}
        hitSlop={8}
      >
        <Feather name="chevron-down" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
    borderTopWidth: 1,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
