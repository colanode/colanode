import Feather from '@expo/vector-icons/Feather';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { AnimatedLogo } from '@colanode/mobile/components/ui/animated-logo';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const { data: servers } = useLiveQuery({ type: 'server.list' });
  const server = servers?.[0];

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>
            {'\u2039'} Back
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.appSection}>
        <AnimatedLogo size={80} />
        <Text style={[styles.appName, { color: colors.text }]}>Colanode</Text>
        <Text style={[styles.version, { color: colors.textMuted }]}>
          Version {version}
        </Text>
      </View>

      {server && (
        <View style={styles.serverSection}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            SERVER
          </Text>
          <View style={[styles.serverCard, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.serverHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              {server.avatar ? (
                server.avatar.endsWith('.svg') ? (
                  <SvgUri uri={server.avatar} width={28} height={28} />
                ) : (
                  <Image source={{ uri: server.avatar }} style={styles.serverAvatar} />
                )
              ) : (
                <Feather name="server" size={20} color={colors.primary} />
              )}
              <View style={styles.serverHeaderText}>
                <Text style={[styles.serverName, { color: colors.text }]}>
                  {server.name}
                </Text>
                <Text style={[styles.serverDomain, { color: colors.textMuted }]}>
                  {server.domain}
                </Text>
              </View>
            </View>
            <View style={styles.serverInfo}>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.surfaceHover },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Status
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                    server.state?.isAvailable && { color: colors.success },
                  ]}
                >
                  {server.state?.isAvailable ? 'Available' : 'Unavailable'}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.surfaceHover },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Version
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {server.version}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.surfaceHover },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Domain
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {server.domain}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backText: {
    fontSize: 16,
    width: 60,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  appSection: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 24,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },
  version: {
    fontSize: 15,
  },
  serverSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  serverCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  serverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  serverHeaderText: {
    flex: 1,
    gap: 2,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serverDomain: {
    fontSize: 13,
  },
  serverInfo: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
  },
});
