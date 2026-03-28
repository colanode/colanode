import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';

import { DownloadStatus, TempFile } from '@colanode/client/types/files';
import { LocalFileNode, LocalNode } from '@colanode/client/types/nodes';
import { FileStatus } from '@colanode/core';
import { FileItem } from '@colanode/mobile/components/files/file-item';
import { NodeIcon } from '@colanode/mobile/components/nodes/node-icon';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { getNodeDisplayName, NODE_TYPE_LABELS } from '@colanode/mobile/lib/node-utils';

type JSONAttributeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSONAttributeValue[];

type JSONAttributes = Record<string, JSONAttributeValue>;

type ReferenceNodeType = 'page' | 'folder' | 'database';

interface JSONContent {
  type?: string;
  text?: string;
  attrs?: JSONAttributes;
  marks?: Array<{ type: string; attrs?: JSONAttributes }>;
  content?: JSONContent[];
}

interface BlockRendererProps {
  content: JSONContent;
}

interface InlineRendererProps {
  nodes: JSONContent[];
}

const MARK_COLORS: Record<
  string,
  { textColor?: string; backgroundColor?: string }
> = {
  gray: {
    textColor: '#4b5563',
    backgroundColor: '#e5e7eb',
  },
  orange: {
    textColor: '#ea580c',
    backgroundColor: '#fed7aa',
  },
  yellow: {
    textColor: '#ca8a04',
    backgroundColor: '#fef08a',
  },
  green: {
    textColor: '#16a34a',
    backgroundColor: '#bbf7d0',
  },
  blue: {
    textColor: '#2563eb',
    backgroundColor: '#bfdbfe',
  },
  purple: {
    textColor: '#9333ea',
    backgroundColor: '#e9d5ff',
  },
  pink: {
    textColor: '#db2777',
    backgroundColor: '#fbcfe8',
  },
  red: {
    textColor: '#dc2626',
    backgroundColor: '#fecaca',
  },
};

const getStringAttribute = (
  attrs: JSONAttributes | undefined,
  key: string
) => {
  const value = attrs?.[key];
  return typeof value === 'string' ? value : undefined;
};

const getNumberAttribute = (
  attrs: JSONAttributes | undefined,
  key: string
) => {
  const value = attrs?.[key];
  return typeof value === 'number' ? value : undefined;
};

const getBooleanAttribute = (
  attrs: JSONAttributes | undefined,
  key: string
) => {
  const value = attrs?.[key];
  return typeof value === 'boolean' ? value : false;
};

const getNodeKey = (node: JSONContent, fallback: number) => {
  const stringId = getStringAttribute(node.attrs, 'id');
  if (stringId) {
    return stringId;
  }

  const numericId = getNumberAttribute(node.attrs, 'id');
  if (numericId !== undefined) {
    return numericId;
  }

  return fallback;
};

const isReferenceNodeType = (
  type: string | undefined
): type is ReferenceNodeType => {
  return type === 'page' || type === 'folder' || type === 'database';
};

const getReferenceNodeSubtitle = (content: JSONContent) => {
  if (content.type === 'database' && getBooleanAttribute(content.attrs, 'inline')) {
    return 'Inline database';
  }

  if (!content.type || !isReferenceNodeType(content.type)) {
    return 'Reference';
  }

  return NODE_TYPE_LABELS[content.type];
};

const getHeadingLevel = (content: JSONContent) => {
  switch (content.type) {
    case 'heading1':
      return 1;
    case 'heading2':
      return 2;
    case 'heading3':
      return 3;
    default:
      return getNumberAttribute(content.attrs, 'level') ?? 1;
  }
};

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
          const label = getStringAttribute(node.attrs, 'label');
          const id = getStringAttribute(node.attrs, 'id');
          return (
            <Text key={i} style={[mentionStyles.mention, { color: colors.primaryLight }]}>
              @{label ?? id ?? 'unknown'}
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
  let style: TextStyle = { color: colors.text, fontSize: 15, lineHeight: 22 };

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
      case 'color': {
        const color = getStringAttribute(mark.attrs, 'color');
        const palette = color ? MARK_COLORS[color] : undefined;
        if (palette?.textColor) {
          style = { ...style, color: palette.textColor };
        }
        break;
      }
      case 'highlight': {
        const highlight = getStringAttribute(mark.attrs, 'highlight');
        const palette = highlight ? MARK_COLORS[highlight] : undefined;
        if (palette?.backgroundColor) {
          style = { ...style, backgroundColor: palette.backgroundColor };
        }
        break;
      }
      case 'link':
        isLink = true;
        href = getStringAttribute(mark.attrs, 'href') ?? '';
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

const ReferenceNodeBlockRenderer = ({ content }: { content: JSONContent }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { userId } = useWorkspace();

  if (!isReferenceNodeType(content.type)) {
    return null;
  }

  const nodeId = getStringAttribute(content.attrs, 'id');
  const { data: node } = useNodeQuery<LocalNode>(userId, nodeId, content.type);

  if (!nodeId) {
    return null;
  }

  const canOpen = content.type !== 'database';
  const name = node ? getNodeDisplayName(node) : 'Untitled';
  const subtitle = getReferenceNodeSubtitle(content);

  return (
    <Pressable
      disabled={!canOpen}
      onPress={() => {
        if (content.type === 'page') {
          router.push({
            pathname: '/(app)/(spaces)/page/[pageId]',
            params: { pageId: nodeId },
          });
        }

        if (content.type === 'folder') {
          router.push({
            pathname: '/(app)/(spaces)/folder/[folderId]',
            params: { folderId: nodeId },
          });
        }
      }}
      style={({ pressed }) => [
        styles.referenceBlock,
        { backgroundColor: colors.surface, borderColor: colors.border },
        canOpen && pressed && styles.referenceBlockPressed,
      ]}
    >
      <NodeIcon type={content.type} size={18} />
      <View style={styles.referenceContent}>
        <Text style={[styles.referenceTitle, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        <Text
          style={[styles.referenceSubtitle, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
};

const navigateToFile = (router: ReturnType<typeof useRouter>, fileId: string) => {
  router.push({
    pathname: '/(app)/(spaces)/file/[fileId]',
    params: { fileId },
  });
};

const ImagePreviewPlaceholder = ({
  fileName,
  subtitle,
  loading = false,
}: {
  fileName: string;
  subtitle: string;
  loading?: boolean;
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.imagePreviewCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.imagePreviewStatus}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <NodeIcon type="file" size={22} />
        )}
        <Text
          style={[styles.imagePreviewStatusText, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>
      <View
        style={[
          styles.imagePreviewCaption,
          { borderTopColor: colors.border },
        ]}
      >
        <Text
          style={[styles.referenceTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {fileName}
        </Text>
      </View>
    </View>
  );
};

const ImageFileBlockRenderer = ({ file }: { file: LocalFileNode }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { userId } = useWorkspace();
  const { data: localFile } = useLiveQuery({
    type: 'local.file.get',
    fileId: file.id,
    userId,
    autoDownload: file.status === FileStatus.Ready,
  });

  const progress =
    localFile?.downloadStatus === DownloadStatus.Downloading &&
    localFile.downloadProgress > 0
      ? ` ${Math.round(localFile.downloadProgress)}%`
      : '';
  const fileName = file.name ?? 'Image';

  let content: React.ReactNode;

  if (localFile?.downloadStatus === DownloadStatus.Completed) {
    content = (
      <View
        style={[
          styles.imagePreviewCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Image
          source={{ uri: localFile.url ?? localFile.path }}
          style={styles.imagePreview}
          resizeMode="contain"
        />
        <View
          style={[
            styles.imagePreviewCaption,
            { borderTopColor: colors.border },
          ]}
        >
          <Text
            style={[styles.referenceTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
        </View>
      </View>
    );
  } else if (file.status !== FileStatus.Ready) {
    content = (
      <ImagePreviewPlaceholder
        fileName={fileName}
        subtitle="Image upload pending"
      />
    );
  } else if (localFile?.downloadStatus === DownloadStatus.Failed) {
    content = (
      <ImagePreviewPlaceholder
        fileName={fileName}
        subtitle="Image preview unavailable"
      />
    );
  } else {
    content = (
      <ImagePreviewPlaceholder
        fileName={fileName}
        subtitle={`Loading image preview${progress}`}
        loading
      />
    );
  }

  return (
    <Pressable
      onPress={() => navigateToFile(router, file.id)}
      style={({ pressed }) => [
        styles.imageBlock,
        pressed && styles.referenceBlockPressed,
      ]}
    >
      {content}
    </Pressable>
  );
};

const FileBlockRenderer = ({ content }: { content: JSONContent }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { userId } = useWorkspace();
  const fileId = getStringAttribute(content.attrs, 'id');
  const { data: file } = useNodeQuery<LocalFileNode>(userId, fileId, 'file');

  if (!fileId) {
    return null;
  }

  if (file?.subtype === 'image') {
    return <ImageFileBlockRenderer file={file} />;
  }

  return (
    <Pressable
      onPress={() => navigateToFile(router, fileId)}
      style={({ pressed }) => [styles.fileBlock, pressed && styles.fileBlockPressed]}
    >
      {file ? (
        <FileItem file={file} />
      ) : (
        <View
          style={[
            styles.fileFallback,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={styles.fileIcon}>{'\u{1F4CE}'}</Text>
          <Text style={[styles.fileLabel, { color: colors.text }]}>
            Attached file
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const TempFileBlockRenderer = ({ content }: { content: JSONContent }) => {
  const { colors } = useTheme();
  const tempFileId = getStringAttribute(content.attrs, 'id');
  const { data: tempFiles } = useLiveQuery({ type: 'temp.file.list' });
  const tempFile = tempFiles?.find(
    (candidate: TempFile) => candidate.id === tempFileId
  );

  if (!tempFileId) {
    return null;
  }

  return (
    <View
      style={[
        styles.referenceBlock,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <NodeIcon type="file" size={18} />
      <View style={styles.referenceContent}>
        <Text style={[styles.referenceTitle, { color: colors.text }]} numberOfLines={1}>
          {tempFile?.name ?? 'Uploading file'}
        </Text>
        <Text
          style={[styles.referenceSubtitle, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {tempFile?.subtype ? `${tempFile.subtype} upload` : 'Pending upload'}
        </Text>
      </View>
    </View>
  );
};

export const BlockRenderer = ({ content }: BlockRendererProps) => {
  const { colors } = useTheme();

  if (!content.type) return null;

  switch (content.type) {
    case 'doc':
      return (
        <View>
          {content.content?.map((child, i) => (
            <BlockRenderer key={getNodeKey(child, i)} content={child} />
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

    case 'heading':
    case 'heading1':
    case 'heading2':
    case 'heading3': {
      const level = getHeadingLevel(content);
      const fontSize = level === 1 ? 24 : level === 2 ? 20 : 18;
      return (
        <View style={styles.heading}>
          <Text style={[styles.headingText, { fontSize, color: colors.text }]}>
            {content.content && <InlineRenderer nodes={content.content} />}
          </Text>
        </View>
      );
    }

    case 'file':
      return <FileBlockRenderer content={content} />;

    case 'page':
    case 'folder':
    case 'database':
      return <ReferenceNodeBlockRenderer content={content} />;

    case 'tempFile':
      return <TempFileBlockRenderer content={content} />;

    case 'bulletList':
      return (
        <View style={styles.list}>
          {content.content?.map((child, i) => (
            <View key={getNodeKey(child, i)} style={styles.listItemRow}>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>{'\u2022'}</Text>
              <View style={styles.listItemContent}>
                {child.content?.map((inner, j) => (
                  <BlockRenderer key={getNodeKey(inner, j)} content={inner} />
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
            <View key={getNodeKey(child, i)} style={styles.listItemRow}>
              <Text style={[styles.orderedNumber, { color: colors.textSecondary }]}>{i + 1}.</Text>
              <View style={styles.listItemContent}>
                {child.content?.map((inner, j) => (
                  <BlockRenderer key={getNodeKey(inner, j)} content={inner} />
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
            <TaskItemRenderer key={getNodeKey(child, i)} content={child} />
          ))}
        </View>
      );

    case 'taskItem':
      return <TaskItemRenderer content={content} />;

    case 'listItem':
      return (
        <View>
          {content.content?.map((child, i) => (
            <BlockRenderer key={getNodeKey(child, i)} content={child} />
          ))}
        </View>
      );

    case 'blockquote':
      return (
        <View style={[styles.blockquote, { borderLeftColor: colors.sheetHandle }]}>
          {content.content?.map((child, i) => (
            <BlockRenderer key={getNodeKey(child, i)} content={child} />
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
            <View key={getNodeKey(row, i)} style={[tableStyles.row, { borderBottomColor: colors.border }]}>
              {row.content?.map((cell, j) => (
                <View
                  key={getNodeKey(cell, j)}
                  style={[
                    tableStyles.cell,
                    { borderRightColor: colors.border },
                    i === 0 && { backgroundColor: colors.surfaceHover },
                  ]}
                >
                  {cell.content?.map((inner, k) => (
                    <BlockRenderer key={getNodeKey(inner, k)} content={inner} />
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
            <BlockRenderer key={getNodeKey(child, i)} content={child} />
          ))}
        </View>
      );

    case 'horizontalRule':
      return <View style={[styles.hr, { backgroundColor: colors.border }]} />;

    case 'hardBreak':
      return <Text>{'\n'}</Text>;

    default:
      // Unsupported block types from the shared editor model.
      return null;
  }
};

const TaskItemRenderer = ({ content }: { content: JSONContent }) => {
  const { colors } = useTheme();
  const checked = getBooleanAttribute(content.attrs, 'checked');

  return (
    <View style={styles.listItemRow}>
      <Text style={[taskStyles.checkbox, { color: colors.textSecondary }]}>
        {checked ? '\u2611' : '\u2610'}
      </Text>
      <View style={styles.listItemContent}>
        {content.content?.map((inner, j) => (
          <BlockRenderer key={getNodeKey(inner, j)} content={inner} />
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
  fileBlock: {
    marginVertical: 6,
  },
  imageBlock: {
    marginVertical: 6,
    alignSelf: 'stretch',
  },
  imagePreviewCard: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
  },
  imagePreview: {
    width: '100%',
    height: 240,
  },
  imagePreviewStatus: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  imagePreviewStatusText: {
    fontSize: 14,
    textAlign: 'center',
  },
  imagePreviewCaption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  fileBlockPressed: {
    opacity: 0.8,
  },
  fileFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  referenceBlock: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  referenceBlockPressed: {
    opacity: 0.8,
  },
  referenceContent: {
    flex: 1,
    gap: 2,
  },
  referenceTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  referenceSubtitle: {
    fontSize: 12,
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
