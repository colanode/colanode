interface WorkspaceTabProps {
  workspaceId: string;
}

export const WorkspaceTab = ({ workspaceId }: WorkspaceTabProps) => {
  return <div>WorkspaceTab {workspaceId}</div>;
};
