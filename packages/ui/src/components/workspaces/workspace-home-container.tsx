import { Container } from '@colanode/ui/components/layouts/containers/container';
import { WorkspaceHomeBreadcrumb } from '@colanode/ui/components/workspaces/workspace-home-breadcrumb';

export const WorkspaceHomeContainer = () => {
  return (
    <Container type="full" breadcrumb={<WorkspaceHomeBreadcrumb />}>
      <div className="h-full w-full flex flex-col gap-1">
        <div className="h-10 app-drag-region"></div>
        <div className="grow flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            What did you get done this week?
          </p>
        </div>
      </div>
    </Container>
  );
};
