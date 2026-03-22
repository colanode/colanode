import { StyleSheet, View } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface ListSeparatorProps {
  marginLeft?: number;
}

export const ListSeparator = ({ marginLeft = 0 }: ListSeparatorProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: colors.listSeparator, marginLeft },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
