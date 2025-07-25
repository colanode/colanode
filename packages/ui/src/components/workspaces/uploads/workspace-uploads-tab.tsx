import { Upload } from 'lucide-react';

export const WorkspaceUploadsTab = () => {
  return (
    <div className="flex items-center space-x-2">
      <Upload className="size-4" />
      <span>Uploads</span>
    </div>
  );
};
