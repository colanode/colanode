import { dialog } from 'electron';

export const showUpgradeRestartDialog = async (): Promise<boolean> => {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Colanode Updated',
    message:
      'Colanode has been upgraded to a new version and needs to restart.',
    detail:
      'We need to reset local app data to ensure compatibility with the new version. Click "Restart now" to proceed.',
    buttons: ['Restart now', 'Close'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  return response === 0;
};

export const showErrorDialog = async (message: string): Promise<void> => {
  await dialog.showMessageBox({
    type: 'error',
    title: 'Error',
    message,
  });
};
