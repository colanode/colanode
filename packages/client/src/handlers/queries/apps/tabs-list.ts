import { SelectTab } from '@colanode/client/databases/app/schema';
import { mapTab } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { TabsListQueryInput } from '@colanode/client/queries/apps/tabs-list';
import { AppService } from '@colanode/client/services/app-service';
import { Tab } from '@colanode/client/types/apps';
import { Event } from '@colanode/client/types/events';

export class TabsListQueryHandler implements QueryHandler<TabsListQueryInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(_: TabsListQueryInput): Promise<Tab[]> {
    const rows = await this.getAppTabs();
    if (!rows) {
      return [];
    }

    return rows.map(mapTab);
  }

  public async checkForChanges(
    event: Event,
    _: TabsListQueryInput,
    output: Tab[]
  ): Promise<ChangeCheckResult<TabsListQueryInput>> {
    if (event.type === 'tab.created') {
      const newOutput = [...output, event.tab];
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'tab.updated') {
      const newOutput = [
        ...output.filter((tab) => tab.id !== event.tab.id),
        event.tab,
      ];

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'tab.deleted') {
      const newOutput = output.filter((tab) => tab.id !== event.tab.id);

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async getAppTabs(): Promise<SelectTab[] | undefined> {
    const rows = await this.app.database
      .selectFrom('tabs')
      .selectAll()
      .execute();

    return rows;
  }
}
