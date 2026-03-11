import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalFileNode } from '@colanode/client/types/nodes';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { LoadingScreen } from '@colanode/mobile/components/loading-screen';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

const FILE_TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  image: 'image',
  video: 'film',
  audio: 'music',
  document: 'file-text',
};

export default function FileScreen() {
  const router = useRouter();
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const { userId } = useWorkspace();
  const { appService } = useAppService();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { mutate, isPending } = useMutation();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { data: fileNodes, isLoading } = useNodeListQuery(
    userId,
    [
      { field: ['id'], operator: 'eq', value: fileId },
      { field: ['type'], operator: 'eq', value: 'file' },
    ],
    [],
    1
  );

  const file = fileNodes?.[0] as LocalFileNode | undefined;

  useEffect(() => {
    if (!file) return;
    const path = appService.path.workspaceFile(userId, file.id, file.extension);
    appService.fs.exists(path).then((exists) => {
      setFileUri(exists ? path : null);
    });
  }, [file, userId, appService]);

  const handleDownload = () => {
    if (!file || downloading || isPending) return;

    const path = appService.path.workspaceFile(userId, file.id, file.extension);
    setDownloading(true);

    mutate({
      input: {
        type: 'file.download',
        userId,
        fileId: file.id,
        path,
      },
      async onSuccess() {
        // Poll briefly for the file to appear (download happens async)
        let attempts = 0;
        const check = async () => {
          const exists = await appService.fs.exists(path);
          if (exists) {
            setFileUri(path);
            setDownloading(false);
          } else if (attempts < 30) {
            attempts++;
            setTimeout(check, 1000);
          } else {
            setDownloading(false);
          }
        };
        await check();
      },
      onError() {
        setDownloading(false);
      },
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isImage = file?.subtype === 'image';
  const iconName = FILE_TYPE_ICONS[file?.subtype ?? ''] ?? 'file';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {file?.name ?? 'File'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {isImage && fileUri ? (
          <Image
            source={{ uri: fileUri }}
            style={[styles.imagePreview, { backgroundColor: colors.surface }]}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.filePlaceholder, { backgroundColor: colors.surface }]}>
            <Feather name={iconName} size={48} color={colors.sheetHandle} />
            {!fileUri && file && !downloading && (
              <>
                <Text style={[styles.placeholderNote, { color: colors.textMuted }]}>
                  File not downloaded yet
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.downloadButton,
                    { backgroundColor: colors.primary },
                    pressed && styles.downloadButtonPressed,
                  ]}
                  onPress={handleDownload}
                >
                  <Feather name="download" size={18} color={colors.text} />
                  <Text style={[styles.downloadButtonText, { color: colors.text }]}>Download</Text>
                </Pressable>
              </>
            )}
            {downloading && (
              <View style={styles.downloadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.downloadingText, { color: colors.primary }]}>Downloading...</Text>
              </View>
            )}
            {fileUri && !isImage && (
              <Text style={[styles.placeholderNote, { color: colors.textMuted }]}>
                File downloaded
              </Text>
            )}
          </View>
        )}

        {file && (
          <View style={styles.infoSection}>
            <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                {file.originalName}
              </Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {file.mimeType}
              </Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Size</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatFileSize(file.size)}
              </Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Extension</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {file.extension}
              </Text>
            </View>
          </View>
        )}

        {!file && !isLoading && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>File not found</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  filePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderRadius: 12,
    gap: 12,
  },
  placeholderNote: {
    fontSize: 14,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  downloadButtonPressed: {
    opacity: 0.8,
  },
  downloadButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  downloadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadingText: {
    fontSize: 14,
  },
  infoSection: {
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});
