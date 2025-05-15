export type FileDialogOpenCommandInput = {
  type: 'file_dialog_open';
  options: any;
};

declare module '@colanode/client/commands' {
  interface CommandMap {
    file_dialog_open: {
      input: FileDialogOpenCommandInput;
      output: any;
    };
  }
}
