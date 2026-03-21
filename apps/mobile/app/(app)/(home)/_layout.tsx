import { Stack } from 'expo-router';

import { ErrorBoundary } from '@colanode/mobile/components/ui/error-boundary';
import { useTheme } from '@colanode/mobile/contexts/theme';

export default function HomeLayout() {
  const { colors } = useTheme();

  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </ErrorBoundary>
  );
}
