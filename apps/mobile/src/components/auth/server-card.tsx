import Feather from '@expo/vector-icons/Feather';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { Server } from '@colanode/client/types';
import { useTheme } from '@colanode/mobile/contexts/theme';

interface ServerCardProps {
  server: Server;
  onSelect: (server: Server) => void;
  onDelete?: (server: Server) => void;
}

const ServerAvatarImage = ({ uri, size }: { uri: string; size: number }) => {
  if (uri.endsWith('.svg')) {
    return <SvgUri uri={uri} width={size} height={size} />;
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size * 0.25 }}
    />
  );
};

export const ServerCard = ({ server, onSelect, onDelete }: ServerCardProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.contentButton,
          pressed && { opacity: 0.7, backgroundColor: colors.surfaceHover },
        ]}
        onPress={() => onSelect(server)}
      >
        {server.avatar ? (
          <View style={styles.avatarImage}>
            <ServerAvatarImage uri={server.avatar} size={40} />
          </View>
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {server.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {server.name}
          </Text>
          <Text style={[styles.domain, { color: colors.textSecondary }]} numberOfLines={1}>
            {server.domain}
          </Text>
        </View>
      </Pressable>
      {onDelete && (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { backgroundColor: colors.surfaceHover },
          ]}
          onPress={() => onDelete(server)}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    alignSelf: 'stretch',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  domain: {
    fontSize: 13,
  },
});
