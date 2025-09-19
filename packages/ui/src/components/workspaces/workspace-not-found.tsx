import { BadgeAlert } from 'lucide-react';

export const WorkspaceNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <BadgeAlert className="size-12 mb-4" />
      <h1 className="text-2xl font-semibold tracking-tight">
        Workspace not found
      </h1>
    </div>
  );
};
