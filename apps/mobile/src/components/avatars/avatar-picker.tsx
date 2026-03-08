import { Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { generateId, IdType } from '@colanode/core';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useMutation } from '@colanode/mobile/hooks/use-mutation';

interface AvatarPickerProps {
  currentName: string;
  currentAvatar: string | null;
  accountId: string;
  size?: number;
  onAvatarUploaded: (avatarId: string) => void;
}

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
];

const getColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length]!;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return (name[0] ?? '?').toUpperCase();
};

export const AvatarPicker = ({
  currentName,
  currentAvatar,
  accountId,
  size = 80,
  onAvatarUploaded,
}: AvatarPickerProps) => {
  const { colors } = useTheme();
  const { appService } = useAppService();
  const { mutate } = useMutation();
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const avatarPath = currentAvatar
    ? appService.path.avatar(currentAvatar)
    : null;

  const handlePress = async () => {
    if (uploading) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0]!;
    setLocalUri(asset.uri);
    setUploading(true);

    try {
      const tempPath = appService.path.tempFile('avatar-upload.jpeg');
      await appService.fs.copy(asset.uri, tempPath);

      const fileInfo = Paths.info(tempPath);
      const fileSize = asset.fileSize ?? ('size' in fileInfo ? (fileInfo as any).size : 0) ?? 0;
      const fileId = generateId(IdType.File);

      mutate({
        input: {
          type: 'avatar.upload',
          accountId,
          file: {
            id: fileId,
            name: 'avatar.jpeg',
            path: tempPath,
            size: fileSize,
            subtype: 'image',
            mimeType: 'image/jpeg',
            extension: '.jpeg',
            url: tempPath,
          },
        },
        onSuccess(output) {
          onAvatarUploaded(output.id);
          setUploading(false);
        },
        onError(error) {
          Alert.alert('Upload Failed', error.message);
          setUploading(false);
          setLocalUri(null);
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to prepare image for upload');
      setUploading(false);
      setLocalUri(null);
    }
  };

  const borderRadius = size * 0.25;
  const displayUri = localUri ?? avatarPath;

  return (
    <Pressable onPress={handlePress} style={styles.wrapper}>
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={{ width: size, height: size, borderRadius }}
          />
        ) : (
          <View
            style={[
              styles.initialsContainer,
              {
                width: size,
                height: size,
                borderRadius,
                backgroundColor: getColor(currentName),
              },
            ]}
          >
            <Text style={[styles.initials, { fontSize: size * 0.4, color: colors.text }]}>
              {getInitials(currentName)}
            </Text>
          </View>
        )}
        {uploading && (
          <View
            style={[
              styles.uploadingOverlay,
              { width: size, height: size, borderRadius },
            ]}
          >
            <ActivityIndicator color={colors.text} />
          </View>
        )}
        <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.editBadgeText, { color: colors.text }]}>Edit</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
