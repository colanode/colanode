import { mapTab } from '@colanode/client/lib';
import { eventBus } from '@colanode/client/lib/event-bus';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  TabUpdateMutationInput,
  TabUpdateMutationOutput,
} from '@colanode/client/mutations/apps/tab-update';
import { AppService } from '@colanode/client/services/app-service';

export class TabUpdateMutationHandler
  implements MutationHandler<TabUpdateMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: TabUpdateMutationInput
  ): Promise<TabUpdateMutationOutput> {
    const updatedTab = await this.app.database
      .updateTable('tabs')
      .returningAll()
      .set({
        location: input.location,
        index: input.index,
        last_active_at: input.lastActiveAt,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!updatedTab) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'tab.updated',
      tab: mapTab(updatedTab),
    });

    return {
      success: true,
    };
  }
}
