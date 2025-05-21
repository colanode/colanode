import { useCallback, useRef, useState } from 'react';

type FileDialogOptions = {
  accept?: string;
  multiple?: boolean;
};

type FileDialogCallbacks = {
  onSelect?: (files: string[]) => void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
};

let activeDialog: HTMLInputElement | null = null;

export const useFileDialog = (options: FileDialogOptions = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const open = useCallback(
    async (callbacks?: FileDialogCallbacks) => {
      if (activeDialog) {
        activeDialog.remove();
        activeDialog = null;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = options.accept || '';
      input.multiple = options.multiple || false;

      input.onchange = async () => {
        setIsOpen(false);
        if (input.files) {
          try {
            const files = Array.from(input.files);
            const fileNames = await Promise.all(
              files.map((file) => window.colanode.saveTempFile(file))
            );
            callbacks?.onSelect?.(fileNames);
          } catch (error) {
            callbacks?.onError?.(error);
          }
        }
        input.remove();
        activeDialog = null;
      };

      input.oncancel = () => {
        setIsOpen(false);
        callbacks?.onCancel?.();
        input.remove();
        activeDialog = null;
      };

      document.body.appendChild(input);
      inputRef.current = input;
      activeDialog = input;
      setIsOpen(true);
      input.click();
    },
    [options.accept, options.multiple]
  );

  return {
    isOpen,
    open,
  };
};
