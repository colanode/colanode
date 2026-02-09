import { build, formatDate, timeAgo } from '@colanode/core';
import { InfoBreadcrumb } from '@colanode/ui/components/app/info-breadcrumb';
import { Container } from '@colanode/ui/components/layouts/containers/container';
import { ServerAvatar } from '@colanode/ui/components/servers/server-avatar';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useServer } from '@colanode/ui/contexts/server';

export const InfoContainer = () => {
  const server = useServer();

  return (
    <Container type="full" breadcrumb={<InfoBreadcrumb />}>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            App information
          </h2>
          <Separator className="mt-3" />
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-baseline">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm">{build.version}</span>
            <span className="text-sm text-muted-foreground">SHA</span>
            <span className="text-sm font-mono break-all">{build.sha}</span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Server</h2>
              <Separator className="mt-2" />
            </div>
            <div className="flex items-center gap-3">
              <ServerAvatar
                url={server.avatar}
                name={server.name}
                className="size-10 rounded-lg"
              />
              <div className="grid gap-0.5">
                <span className="text-sm font-semibold">{server.name}</span>
                <span className="text-xs text-muted-foreground">
                  {server.domain}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-baseline">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm">
                {server.state?.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm">{server.version}</span>
              <span className="text-sm text-muted-foreground">SHA</span>
              <span className="text-sm font-mono break-all">
                {server.attributes.sha ?? 'Unknown'}
              </span>
              <span className="text-sm text-muted-foreground">Domain</span>
              <span className="text-sm font-mono break-all">
                {server.domain}
              </span>
              <span className="text-sm text-muted-foreground">URL</span>
              <a
                href={server.configUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline font-mono break-all"
              >
                {server.configUrl}
              </a>
              <span className="text-sm text-muted-foreground">Last sync</span>
              <span className="text-sm">
                {server.syncedAt ? timeAgo(server.syncedAt) : 'Never'}
              </span>
              <span className="text-sm text-muted-foreground">Last ping</span>
              <span className="text-sm">
                {server.state?.lastCheckedAt
                  ? timeAgo(server.state.lastCheckedAt)
                  : 'Never'}
              </span>
              <span className="text-sm text-muted-foreground">Added</span>
              <span className="text-sm">{formatDate(server.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
