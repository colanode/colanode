import Feather from '@expo/vector-icons/Feather';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';

interface BlockTypeOption {
  type: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const BLOCK_TYPES: BlockTypeOption[] = [
  { type: 'paragraph', label: 'Text', icon: 'type' },
  { type: 'heading1', label: 'Heading 1', icon: 'hash' },
  { type: 'heading2', label: 'Heading 2', icon: 'hash' },
  { type: 'heading3', label: 'Heading 3', icon: 'hash' },
  { type: 'bulletList', label: 'Bullet List', icon: 'list' },
  { type: 'orderedList', label: 'Numbered List', icon: 'list' },
  { type: 'taskList', label: 'To-do List', icon: 'check-square' },
  { type: 'blockquote', label: 'Quote', icon: 'minus' },
  { type: 'codeBlock', label: 'Code', icon: 'code' },
  { type: 'divider', label: 'Divider', icon: 'minus' },
  { type: 'table', label: 'Table', icon: 'grid' },
];

interface PageBlockTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectBlockType: (blockType: string) => void;
}

export const PageBlockTypeSheet = ({
  visible,
  onClose,
  onSelectBlockType,
}: PageBlockTypeSheetProps) => {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="60%">
      <Text style={[styles.title, { color: colors.text }]}>Block type</Text>
      <ScrollView>
        {BLOCK_TYPES.map((block) => (
          <Pressable
            key={block.type}
            style={({ pressed }) => [
              styles.action,
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={() => {
              onSelectBlockType(block.type);
              onClose();
            }}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.surfaceHover },
              ]}
            >
              <Feather name={block.icon} size={18} color={colors.text} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>
              {block.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
  },
});
