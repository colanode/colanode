import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';
import { useNetworkStatus } from '@colanode/mobile/hooks/use-network-status';

export const NetworkBanner = () => {
  const { colors } = useTheme();
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.warningDark }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        No internet connection
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
