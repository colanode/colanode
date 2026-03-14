import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { BottomSheet } from '@colanode/mobile/components/ui/bottom-sheet';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { BLOCK_TYPE_OPTIONS } from '@colanode/mobile/lib/page-editor';

interface PageBlockTypeSheetProps {
  visible: boolean;
  currentType: string;
  onSelect: (type: string) => void;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  paragraph: 'type',
  heading1: 'hash',
  heading2: 'hash',
  heading3: 'hash',
  bulletItem: 'list',
  orderedItem: 'list',
  taskItem: 'check-square',
  blockquote: 'minus',
  horizontalRule: 'minus',
};

export const PageBlockTypeSheet = ({
  visible,
  currentType,
  onSelect,
  onClose,
}: PageBlockTypeSheetProps) => {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors.text }]}>Block type</Text>
      <View style={styles.options}>
        {BLOCK_TYPE_OPTIONS.map((option) => {
          const isSelected = option.type === currentType;
          return (
            <Pressable
              key={option.type}
              style={({ pressed }) => [
                styles.option,
                pressed && { backgroundColor: colors.surfaceHover },
                isSelected && { backgroundColor: colors.surfaceHover },
              ]}
              onPress={() => {
                onSelect(option.type);
                onClose();
              }}
            >
              <Feather
                name={TYPE_ICONS[option.type] as any ?? 'type'}
                size={18}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionLabel,
                  { color: isSelected ? colors.primary : colors.text },
                ]}
              >
                {option.label}
              </Text>
              {isSelected && (
                <Feather name="check" size={18} color={colors.primary} />
              )}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  options: {
    paddingHorizontal: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
});
