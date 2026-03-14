import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TextInputSubmitEditingEventData,
  View,
} from 'react-native';

import { Block } from '@colanode/core';
import { mapBlocksToContents } from '@colanode/client/lib';
import { BlockRenderer } from '@colanode/mobile/components/messages/block-renderer';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { EditableBlock } from '@colanode/mobile/lib/page-editor';

export interface BlockRowRef {
  focus: () => void;
  isFocused: () => boolean;
}

interface PageBlockRowProps {
  block: EditableBlock;
  originalBlocks: Record<string, Block>;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onBackspaceEmpty: () => void;
  onToggleCheck?: () => void;
  onLongPress: () => void;
}

const HEADING_SIZES: Record<string, number> = {
  heading1: 24,
  heading2: 20,
  heading3: 18,
};

export const PageBlockRow = forwardRef<BlockRowRef, PageBlockRowProps>(
  (
    { block, originalBlocks, onChangeText, onSubmit, onBackspaceEmpty, onToggleCheck, onLongPress },
    ref
  ) => {
    const { colors } = useTheme();
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      isFocused: () => inputRef.current?.isFocused() ?? false,
    }));

    // Non-editable blocks: render with BlockRenderer using original block data
    if (!block.editable) {
      const originalBlock = originalBlocks[block.id];
      if (originalBlock) {
        const allBlocks = Object.values(originalBlocks);
        const contents = mapBlocksToContents(block.id, allBlocks);
        const jsonContent = {
          type: originalBlock.type,
          attrs: { id: originalBlock.id, ...(originalBlock.attrs ?? {}) },
          content: contents.length > 0 ? contents : undefined,
        };
        // For leaf blocks, map content from the block's leafs
        if (originalBlock.content && originalBlock.content.length > 0) {
          jsonContent.content = originalBlock.content.map((leaf) => ({
            type: leaf.type,
            ...(leaf.text && { text: leaf.text }),
            ...(leaf.attrs && { attrs: leaf.attrs }),
            ...(leaf.marks?.length && {
              marks: leaf.marks.map((m) => ({
                type: m.type,
                ...(m.attrs && { attrs: m.attrs }),
              })),
            }),
          }));
        }
        return (
          <View style={styles.readOnlyRow}>
            <BlockRenderer content={jsonContent} />
          </View>
        );
      }
      return null;
    }

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Backspace' && block.text === '') {
        onBackspaceEmpty();
      }
    };

    const handleSubmitEditing = (_e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      onSubmit();
    };

    if (block.type === 'horizontalRule') {
      return (
        <Pressable onLongPress={onLongPress} delayLongPress={300}>
          <View style={[styles.hr, { backgroundColor: colors.border }]} />
        </Pressable>
      );
    }

    const fontSize = HEADING_SIZES[block.type] ?? 15;
    const fontWeight = block.type.startsWith('heading') ? ('bold' as const) : ('normal' as const);
    const lineHeight = Math.round(fontSize * 1.4);

    const renderPrefix = () => {
      if (block.type === 'bulletItem') {
        return (
          <Text style={[styles.prefix, { color: colors.textSecondary, lineHeight }]}>
            {'\u2022'}
          </Text>
        );
      }
      if (block.type === 'orderedItem') {
        return (
          <Text style={[styles.orderedPrefix, { color: colors.textSecondary, lineHeight }]}>
            {'#.'}
          </Text>
        );
      }
      if (block.type === 'taskItem') {
        return (
          <Pressable onPress={onToggleCheck} hitSlop={8}>
            <Text style={[styles.taskPrefix, { color: colors.textSecondary, lineHeight }]}>
              {block.checked ? '\u2611' : '\u2610'}
            </Text>
          </Pressable>
        );
      }
      if (block.type === 'blockquote') {
        return <View style={[styles.quoteBorder, { backgroundColor: colors.sheetHandle }]} />;
      }
      return null;
    };

    const placeholder = block.type.startsWith('heading') ? 'Heading' : '';

    return (
      <Pressable onLongPress={onLongPress} delayLongPress={300}>
        <View style={styles.row}>
          {renderPrefix()}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize,
                fontWeight,
                lineHeight,
              },
              block.type === 'blockquote' && styles.blockquoteText,
            ]}
            value={block.text}
            onChangeText={onChangeText}
            onKeyPress={handleKeyPress}
            onSubmitEditing={handleSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor={colors.textPlaceholder}
            multiline
            blurOnSubmit
            scrollEnabled={false}
            returnKeyType="next"
            textAlignVertical="top"
          />
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 28,
  },
  prefix: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  orderedPrefix: {
    fontSize: 15,
    width: 24,
    textAlign: 'right',
    marginRight: 4,
  },
  taskPrefix: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  quoteBorder: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 10,
    alignSelf: 'stretch',
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  blockquoteText: {
    fontStyle: 'italic',
  },
  readOnlyRow: {
    marginVertical: 2,
  },
  hr: {
    height: 1,
    marginVertical: 12,
  },
});
