import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface BackButtonProps {
  onPress: () => void;
}

export const BackButton = ({ onPress }: BackButtonProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Feather name="chevron-left" size={24} color={colors.textSecondary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
