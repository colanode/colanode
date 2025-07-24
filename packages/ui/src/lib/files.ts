import { TempFile } from '@colanode/client/types';
import { FileSubtype } from '@colanode/core';

export interface FileDialogOptions {
  accept?: string;
  multiple?: boolean;
}

export type FileDialogSuccessResult = {
  type: 'success';
  files: TempFile[];
};

export type FileDialogCancelResult = {
  type: 'cancel';
};

export type FileDialogErrorResult = {
  type: 'error';
  error: string;
};

export type FileDialogResult =
  | FileDialogSuccessResult
  | FileDialogCancelResult
  | FileDialogErrorResult;

let activeDialog: HTMLInputElement | null = null;

export const openFileDialog = (
  options?: FileDialogOptions
): Promise<FileDialogResult> => {
  return new Promise((resolve) => {
    if (activeDialog) {
      activeDialog.remove();
      activeDialog = null;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = options?.accept || '';
    input.multiple = options?.multiple || false;

    const cleanup = () => {
      input.remove();
      activeDialog = null;
    };

    input.onchange = async () => {
      if (!input.files?.length) {
        cleanup();
        resolve({ type: 'cancel' });
        return;
      }

      try {
        const files = Array.from(input.files);
        const fileNames = await Promise.all(
          files.map((file) => window.colanode.saveTempFile(file))
        );
        resolve({ type: 'success', files: fileNames });
      } catch (error) {
        if (error instanceof Error) {
          resolve({ type: 'error', error: error.message });
        } else {
          resolve({
            type: 'error',
            error: 'An error occurred while saving the files',
          });
        }
      } finally {
        cleanup();
      }
    };

    input.oncancel = () => {
      cleanup();
      resolve({ type: 'cancel' });
    };

    document.body.appendChild(input);
    activeDialog = input;
    input.click();
  });
};

export const canPreviewFile = (subtype: FileSubtype) => {
  return subtype === 'image' || subtype === 'video' || subtype === 'audio';
};
