import { StyleSheet, TextInput } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface PageTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
}

export const PageTitleInput = ({ value, onChangeText, onBlur }: PageTitleInputProps) => {
  const { colors } = useTheme();

  return (
    <TextInput
      style={[styles.input, { color: colors.text }]}
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder="Page title"
      placeholderTextColor={colors.textPlaceholder}
      autoFocus={false}
      multiline
      scrollEnabled={false}
      blurOnSubmit
      returnKeyType="next"
    />
  );
};

const styles = StyleSheet.create({
  input: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 0,
    marginBottom: 12,
  },
});
