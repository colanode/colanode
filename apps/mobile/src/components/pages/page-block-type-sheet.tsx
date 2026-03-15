import Feather from '@expo/vector-icons/Feather';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface BlockType {
  command: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const BLOCK_TYPES: BlockType[] = [
  { command: 'paragraph', label: 'Text', icon: 'type' },
  { command: 'heading1', label: 'Heading 1', icon: 'hash' },
  { command: 'heading2', label: 'Heading 2', icon: 'hash' },
  { command: 'heading3', label: 'Heading 3', icon: 'hash' },
  { command: 'bulletList', label: 'Bullet List', icon: 'list' },
  { command: 'orderedList', label: 'Numbered List', icon: 'list' },
  { command: 'taskList', label: 'To-do', icon: 'check-square' },
  { command: 'blockquote', label: 'Quote', icon: 'message-square' },
  { command: 'codeBlock', label: 'Code', icon: 'code' },
  { command: 'divider', label: 'Divider', icon: 'minus' },
  { command: 'table', label: 'Table', icon: 'grid' },
];

interface PageBlockTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
}

export const PageBlockTypeSheet = ({
  visible,
  onClose,
  onSelect,
}: PageBlockTypeSheetProps) => {
  const { colors } = useTheme();

  if (!visible) return null;

  const handleSelect = (command: string) => {
    onSelect(command);
    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Block type</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      <ScrollView style={styles.list} keyboardShouldPersistTaps="always">
        {BLOCK_TYPES.map((block) => (
          <Pressable
            key={block.command}
            style={({ pressed }) => [
              styles.item,
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={() => handleSelect(block.command)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.surfaceHover },
              ]}
            >
              <Feather name={block.icon} size={18} color={colors.textSecondary} />
            </View>
            <Text style={[styles.label, { color: colors.text }]}>
              {block.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 240,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
  },
});
