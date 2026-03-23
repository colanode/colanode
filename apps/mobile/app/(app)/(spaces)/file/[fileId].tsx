import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DownloadStatus } from '@colanode/client/types/files';
import { LocalFileNode } from '@colanode/client/types/nodes';
import { SkeletonFilePreview } from '@colanode/mobile/components/ui/skeleton';
import { BackButton } from '@colanode/mobile/components/ui/back-button';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { formatFileSize } from '@colanode/mobile/lib/format-utils';

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
  const toast = useToast();
  const { mutate } = useMutation();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const { data: file, isLoading } = useNodeQuery<LocalFileNode>(userId, fileId, 'file');

  // Reactively track download status via local.file.get with autoDownload
  const { data: localFile } = useLiveQuery({
    type: 'local.file.get',
    fileId: fileId!,
    userId,
    autoDownload: true,
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derive fileUri from download status
  useEffect(() => {
    if (!file) {
      setFileUri(null);
      return;
    }

    if (localFile?.downloadStatus === DownloadStatus.Completed) {
      const path = appService.path.workspaceFile(userId, file.id, file.extension);
      let cancelled = false;
      appService.fs.exists(path).then((exists: boolean) => {
        if (!cancelled && isMountedRef.current) {
          setFileUri(exists ? path : null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    setFileUri(null);
  }, [file, localFile, userId, appService]);

  // Show toast when download fails
  const prevStatusRef = useRef<string | undefined>();
  useEffect(() => {
    if (
      localFile?.downloadStatus === DownloadStatus.Failed &&
      prevStatusRef.current !== DownloadStatus.Failed
    ) {
      toast.show(
        localFile.downloadErrorMessage ?? 'Download failed'
      );
    }
    prevStatusRef.current = localFile?.downloadStatus;
  }, [localFile?.downloadStatus, localFile?.downloadErrorMessage, toast]);

  const handleRetry = () => {
    if (!file) return;
    const path = appService.path.workspaceFile(userId, file.id, file.extension);
    mutate({
      input: {
        type: 'file.download',
        userId,
        fileId: file.id,
        path,
      },
    });
  };

  const handleOpen = async () => {
    if (!fileUri) return;

    try {
      const canOpen = await Linking.canOpenURL(fileUri);
      if (!canOpen) {
        Alert.alert('Open Failed', 'This file cannot be opened on this device.');
        return;
      }
      await Linking.openURL(fileUri);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to open file.';
      Alert.alert('Open Failed', message);
    }
  };

  const handleShare = async () => {
    if (!fileUri) return;

    try {
      await Share.share({
        url: fileUri,
        message: file?.originalName ?? file?.name ?? 'Colanode file',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to share file.';
      Alert.alert('Share Failed', message);
    }
  };

  if (isLoading) {
    return <SkeletonFilePreview />;
  }

  const isImage = file?.subtype === 'image';
  const iconName = FILE_TYPE_ICONS[file?.subtype ?? ''] ?? 'file';
  const isDownloading =
    !fileUri &&
    file &&
    (!localFile ||
      localFile.downloadStatus === DownloadStatus.Pending ||
      localFile.downloadStatus === DownloadStatus.Downloading);
  const isFailed =
    !fileUri && file && localFile?.downloadStatus === DownloadStatus.Failed;

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
            {isFailed && (
              <>
                <Text style={[styles.placeholderNote, { color: colors.error }]}>
                  {localFile?.downloadErrorMessage ?? 'Download failed'}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.downloadButton,
                    { backgroundColor: colors.primary },
                    pressed && styles.downloadButtonPressed,
                  ]}
                  onPress={handleRetry}
                >
                  <Feather name="refresh-cw" size={18} color={colors.text} />
                  <Text style={[styles.downloadButtonText, { color: colors.text }]}>Retry</Text>
                </Pressable>
              </>
            )}
            {isDownloading && (
              <View style={styles.downloadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.downloadingText, { color: colors.primary }]}>
                  {localFile?.downloadProgress != null && localFile.downloadProgress > 0
                    ? `Downloading... ${Math.round(localFile.downloadProgress)}%`
                    : 'Downloading...'}
                </Text>
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
            {fileUri && (
              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: colors.primary },
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleOpen}
                >
                  <Feather name="external-link" size={18} color={colors.text} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>
                    Open
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryActionButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleShare}
                >
                  <Feather
                    name="share"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Share
                  </Text>
                </Pressable>
              </View>
            )}
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
