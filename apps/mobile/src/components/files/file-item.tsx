import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LocalFileNode } from '@colanode/client/types/nodes';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { formatFileSize } from '@colanode/mobile/lib/format-utils';

interface FileItemProps {
  file: LocalFileNode;
}

export const FileItem = memo(({ file }: FileItemProps) => {
  const { colors } = useTheme();
  const name = file.name ?? 'Unnamed file';
  const size = formatFileSize(file.size);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.icon}>{'\u{1F4CE}'}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        {size ? <Text style={[styles.size, { color: colors.textMuted }]}>{size}</Text> : null}
      </View>
    </View>
  );
});
FileItem.displayName = 'FileItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
  },
  size: {
    fontSize: 12,
  },
});
