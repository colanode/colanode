import Feather from '@expo/vector-icons/Feather';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);

          // 1. Stop the Mediator from processing events during logout.
          //    This prevents event-driven cache updates (setQueryData)
          //    from re-rendering (app) components while the DB is being destroyed.
          appService.mediator.clearSubscriptions();

          // 2. Cancel all in-flight queries so nothing hits the DB mid-destroy.
          await queryClient.cancelQueries();

          // 3. Navigate away so (app) components unmount.
          router.replace('/(auth)/');

          // 4. Execute logout (closes DB, deletes files).
          //    The (app) tree is unmounting in parallel, but we've already
          //    neutered the Mediator and cancelled queries so no DB access
          //    can be triggered by events or refetches.
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

  const canEditWorkspace = role === 'owner' || role === 'admin';

  const themeIcons = { dark: 'moon', light: 'sun', system: 'smartphone' } as const;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGrouped }]}>
          <Pressable
            style={({ pressed }) => [
              styles.cardItem,
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={() => router.push('/(app)/(settings)/account')}
          >
            <View style={styles.menuItemRow}>
              <Feather name="user" size={18} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Profile</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Workspace</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGrouped }]}>
          <View style={styles.cardItem}>
            <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Name</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{workspace.name}</Text>
          </View>
          <View style={[styles.cardSeparator, { backgroundColor: colors.cardSeparator }]} />
          <View style={styles.cardItem}>
            <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Role</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
          </View>
          {canEditWorkspace && (
            <>
              <View style={[styles.cardSeparator, { backgroundColor: colors.cardSeparator }]} />
              <Pressable
                style={({ pressed }) => [
                  styles.cardItem,
                  pressed && { backgroundColor: colors.surfaceHover },
                ]}
                onPress={() => router.push('/(app)/(settings)/workspace')}
              >
                <View style={styles.menuItemRow}>
                  <Feather name="briefcase" size={18} color={colors.textSecondary} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Workspace</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </Pressable>
            </>
          )}
          <View style={[styles.cardSeparator, { backgroundColor: colors.cardSeparator }]} />
          <Pressable
            style={({ pressed }) => [
              styles.cardItem,
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={() => router.push('/(app)/(settings)/members')}
          >
            <View style={styles.menuItemRow}>
              <Feather name="users" size={18} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Members</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={[styles.cardSeparator, { backgroundColor: colors.cardSeparator }]} />
          <Pressable
            style={({ pressed }) => [
              styles.cardItem,
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={openSwitcher}
          >
            <View style={styles.menuItemRow}>
              <Feather name="repeat" size={18} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Switch Workspace</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Appearance</Text>
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
                    borderColor: isActive ? colors.primary : colors.surfaceActive,
                  },
                ]}
                onPress={() => {
                  void setScheme(option);
                }}
              >
                <Feather
                  name={themeIcons[option]}
                  size={16}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
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
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>App</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGrouped }]}>
          <Pressable
            style={({ pressed }) => [
              styles.cardItem,
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={() => router.push('/(app)/(settings)/about')}
          >
            <View style={styles.menuItemRow}>
              <Feather name="info" size={18} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>About</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {loggingOut ? 'Logging out...' : 'Log Out'}
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
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
  },
  logoutButton: {
    paddingVertical: 14,
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
