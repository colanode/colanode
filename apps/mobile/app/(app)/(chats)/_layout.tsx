import { Stack } from 'expo-router';

import { ErrorBoundary } from '@colanode/mobile/components/ui/error-boundary';
import { useTheme } from '@colanode/mobile/contexts/theme';

// Ensures that deep links into this stack (e.g. pushing [chatId] from the
// Home tab) always have the index (chat list) route below, so pressing
// back navigates to the chat list instead of the previous tab.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function ChatsLayout() {
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
