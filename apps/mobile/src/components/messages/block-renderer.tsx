import { Fragment } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface JSONContent {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  content?: JSONContent[];
}

interface BlockRendererProps {
  content: JSONContent;
}

interface InlineRendererProps {
  nodes: JSONContent[];
}

const InlineRenderer = ({ nodes }: InlineRendererProps) => {
  const { colors } = useTheme();

  return (
    <Text>
      {nodes.map((node, i) => {
        if (node.type === 'text' && node.text) {
          return <StyledText key={i} node={node} />;
        }
        if (node.type === 'hardBreak') {
          return <Text key={i}>{'\n'}</Text>;
        }
        if (node.type === 'mention') {
          return (
            <Text key={i} style={[mentionStyles.mention, { color: colors.primaryLight }]}>
              @{node.attrs?.label ?? node.attrs?.id ?? 'unknown'}
            </Text>
          );
        }
        return null;
      })}
    </Text>
  );
};

const StyledText = ({ node }: { node: JSONContent }) => {
  const { colors } = useTheme();
  const marks = node.marks ?? [];
  let style: any = { color: colors.text, fontSize: 15, lineHeight: 22 };

  let isLink = false;
  let href = '';

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        style = { ...style, fontWeight: 'bold' as const };
        break;
      case 'italic':
        style = { ...style, fontStyle: 'italic' as const };
        break;
      case 'underline':
        style = { ...style, textDecorationLine: 'underline' as const };
        break;
      case 'strike':
        style = { ...style, textDecorationLine: 'line-through' as const };
        break;
      case 'code':
        style = {
          ...style,
          fontFamily: 'monospace',
          backgroundColor: colors.border,
          fontSize: 13,
        };
        break;
      case 'link':
        isLink = true;
        href = mark.attrs?.href ?? '';
        style = { ...style, color: colors.primaryLight, textDecorationLine: 'underline' as const };
        break;
    }
  }

  if (isLink && href) {
    return (
      <Text style={style} onPress={() => Linking.openURL(href)}>
        {node.text}
      </Text>
    );
  }

  return <Text style={style}>{node.text}</Text>;
};

export const BlockRenderer = ({ content }: BlockRendererProps) => {
  const { colors } = useTheme();

  if (!content.type) return null;

  switch (content.type) {
    case 'doc':
      return (
        <View>
          {content.content?.map((child, i) => (
            <BlockRenderer key={child.attrs?.id ?? i} content={child} />
          ))}
        </View>
      );

    case 'paragraph':
      return (
        <View style={styles.paragraph}>
          {content.content && content.content.length > 0 ? (
            <InlineRenderer nodes={content.content} />
          ) : (
            <Text style={[styles.emptyLine, { color: colors.text }]}>{' '}</Text>
          )}
        </View>
      );

    case 'heading': {
      const level = content.attrs?.level ?? 1;
      const fontSize = level === 1 ? 24 : level === 2 ? 20 : 18;
      return (
        <View style={styles.heading}>
          <Text style={[styles.headingText, { fontSize, color: colors.text }]}>
            {content.content && <InlineRenderer nodes={content.content} />}
          </Text>
        </View>
      );
    }

    case 'bulletList':
      return (
        <View style={styles.list}>
          {content.content?.map((child, i) => (
            <View key={child.attrs?.id ?? i} style={styles.listItemRow}>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>{'\u2022'}</Text>
              <View style={styles.listItemContent}>
                {child.content?.map((inner, j) => (
                  <BlockRenderer key={inner.attrs?.id ?? j} content={inner} />
                ))}
              </View>
            </View>
          ))}
        </View>
      );

    case 'orderedList':
      return (
        <View style={styles.list}>
          {content.content?.map((child, i) => (
            <View key={child.attrs?.id ?? i} style={styles.listItemRow}>
              <Text style={[styles.orderedNumber, { color: colors.textSecondary }]}>{i + 1}.</Text>
              <View style={styles.listItemContent}>
                {child.content?.map((inner, j) => (
                  <BlockRenderer key={inner.attrs?.id ?? j} content={inner} />
                ))}
              </View>
            </View>
          ))}
        </View>
      );

    case 'taskList':
      return (
        <View style={styles.list}>
          {content.content?.map((child, i) => (
            <TaskItemRenderer key={child.attrs?.id ?? i} content={child} />
          ))}
        </View>
      );

    case 'taskItem':
      return <TaskItemRenderer content={content} />;

    case 'listItem':
      return (
        <View>
          {content.content?.map((child, i) => (
            <BlockRenderer key={child.attrs?.id ?? i} content={child} />
          ))}
        </View>
      );

    case 'blockquote':
      return (
        <View style={[styles.blockquote, { borderLeftColor: colors.sheetHandle }]}>
          {content.content?.map((child, i) => (
            <BlockRenderer key={child.attrs?.id ?? i} content={child} />
          ))}
        </View>
      );

    case 'codeBlock':
      return (
        <View style={[styles.codeBlock, { backgroundColor: colors.surfaceHover }]}>
          {content.content && <InlineRenderer nodes={content.content} />}
        </View>
      );

    case 'table':
      return (
        <View style={[tableStyles.table, { borderColor: colors.border }]}>
          {content.content?.map((row, i) => (
            <View key={row.attrs?.id ?? i} style={[tableStyles.row, { borderBottomColor: colors.border }]}>
              {row.content?.map((cell, j) => (
                <View
                  key={cell.attrs?.id ?? j}
                  style={[
                    tableStyles.cell,
                    { borderRightColor: colors.border },
                    i === 0 && { backgroundColor: colors.surfaceHover },
                  ]}
                >
                  {cell.content?.map((inner, k) => (
                    <BlockRenderer key={inner.attrs?.id ?? k} content={inner} />
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      );

    case 'tableRow':
    case 'tableCell':
    case 'tableHeader':
      return (
        <View>
          {content.content?.map((child, i) => (
            <BlockRenderer key={child.attrs?.id ?? i} content={child} />
          ))}
        </View>
      );

    case 'horizontalRule':
      return <View style={[styles.hr, { backgroundColor: colors.border }]} />;

    case 'hardBreak':
      return <Text>{'\n'}</Text>;

    default:
      // Unsupported block types (file, image, etc.)
      return null;
  }
};

const TaskItemRenderer = ({ content }: { content: JSONContent }) => {
  const { colors } = useTheme();
  const checked = content.attrs?.checked ?? false;

  return (
    <View style={styles.listItemRow}>
      <Text style={[taskStyles.checkbox, { color: colors.textSecondary }]}>
        {checked ? '\u2611' : '\u2610'}
      </Text>
      <View style={styles.listItemContent}>
        {content.content?.map((inner, j) => (
          <BlockRenderer key={inner.attrs?.id ?? j} content={inner} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 4,
  },
  emptyLine: {
    fontSize: 15,
    lineHeight: 22,
  },
  heading: {
    marginTop: 8,
    marginBottom: 4,
  },
  headingText: {
    fontWeight: 'bold',
  },
  list: {
    marginLeft: 8,
    marginBottom: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    width: 20,
    textAlign: 'center',
  },
  orderedNumber: {
    fontSize: 15,
    lineHeight: 22,
    width: 24,
    textAlign: 'right',
    marginRight: 4,
  },
  listItemContent: {
    flex: 1,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginVertical: 4,
  },
  codeBlock: {
    borderRadius: 6,
    padding: 12,
    marginVertical: 4,
  },
  hr: {
    height: 1,
    marginVertical: 8,
  },
});

const mentionStyles = StyleSheet.create({
  mention: {
    fontWeight: '600',
    fontSize: 15,
  },
});

const taskStyles = StyleSheet.create({
  checkbox: {
    fontSize: 16,
    lineHeight: 22,
    width: 24,
    textAlign: 'center',
  },
});

const tableStyles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderRadius: 6,
    marginVertical: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
  },
});
