import * as DocumentPicker from 'expo-document-picker';
import { useRef } from 'react';

import { extractFileSubtype, generateId, IdType } from '@colanode/core';
import { useToast } from '@colanode/mobile/components/ui/toast';
import { useAppService } from '@colanode/mobile/contexts/app-service';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface UseFolderFileUploadOptions {
  parentId: string;
  userId: string;
}

export const useFolderFileUpload = ({ parentId, userId }: UseFolderFileUploadOptions) => {
  const { appService } = useAppService();
  const { mutate } = useMutation();
  const toast = useToast();
  const pickingRef = useRef(false);

  const pickAndUploadFile = async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0]!;
      const fileName = asset.name;
      const mimeType = asset.mimeType ?? 'application/octet-stream';
      const extension = fileName.includes('.')
        ? '.' + fileName.split('.').pop()!
        : '';
      const fileSize = asset.size ?? 0;

      const tempId = generateId(IdType.TempFile);
      const tempPath = appService.path.tempFile(tempId + extension);
      await appService.fs.copy(asset.uri, tempPath);

      mutate({
        input: {
          type: 'temp.file.create',
          id: tempId,
          name: fileName,
          size: fileSize,
          mimeType,
          subtype: extractFileSubtype(mimeType),
          extension,
          path: tempPath,
        },
        onSuccess() {
          mutate({
            input: {
              type: 'file.create',
              userId,
              parentId,
              tempFileId: tempId,
            },
            onError(error) {
              toast.show(error.message);
            },
          });
        },
        onError(error) {
          toast.show(error.message);
        },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to pick file';
      toast.show(message);
    } finally {
      pickingRef.current = false;
    }
  };

  return { pickAndUploadFile };
};
