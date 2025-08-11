import { Download } from 'lucide-react';

export const WorkspaceDownloadsTab = () => {
  return (
    <div className="flex items-center space-x-2">
      <Download className="size-4" />
      <span>Downloads</span>
    </div>
  );
};
