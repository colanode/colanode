import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useWorkspaceSwitcher } from '@colanode/mobile/contexts/workspace-switcher';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { appService } = useAppService();
  const { accountId, workspace, role } = useWorkspace();
  const { openSwitcher } = useWorkspaceSwitcher();
  const { colors, preference, setScheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);

          // 1. Cancel all in-flight queries and clear the cache
          await queryClient.cancelQueries();
          queryClient.clear();

          // 2. Navigate away so components unmount
          router.replace('/(auth)/');

          // 3. Wait for navigation and unmount to complete
          await new Promise((r) => setTimeout(r, 1000));

          // 4. Execute logout (closes DB, deletes files)
          try {
            await appService.mediator.executeMutation({
              type: 'account.logout',
              accountId,
            });
          } catch {
            // Ignore errors during cleanup
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.surface },
            pressed && { backgroundColor: colors.surfaceHover },
          ]}
          onPress={() => router.push('/(app)/(settings)/account')}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Profile</Text>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>{'\u203A'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Workspace</Text>
        <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{workspace.name}</Text>
        </View>
        <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
        </View>
        {(role === 'owner' || role === 'admin') && (
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: colors.surface },
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={() => router.push('/(app)/(settings)/workspace')}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Workspace</Text>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>{'\u203A'}</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.surface, marginTop: 2 },
            pressed && { backgroundColor: colors.surfaceHover },
          ]}
          onPress={() => router.push('/(app)/(settings)/members')}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>Members</Text>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>{'\u203A'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.surface, marginTop: 2 },
            pressed && { backgroundColor: colors.surfaceHover },
          ]}
          onPress={openSwitcher}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>Switch Workspace</Text>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>{'\u203A'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
        <View style={styles.themeRow}>
          {(['dark', 'light', 'system'] as const).map((option) => {
            const isActive = option === preference;
            return (
              <Pressable
                key={option}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: isActive
                      ? colors.surfaceAccent
                      : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setScheme(option)}
              >
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isActive
                        ? colors.primary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>App</Text>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.surface },
            pressed && { backgroundColor: colors.surfaceHover },
          ]}
          onPress={() => router.push('/(app)/(settings)/about')}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>About</Text>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>{'\u203A'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: colors.surfaceHover, borderColor: colors.error },
            pressed && { backgroundColor: colors.errorBackground },
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  logoutButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
