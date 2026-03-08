import { Stack } from 'expo-router';

import { useTheme } from '@colanode/mobile/contexts/theme';

export default function HomeLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
