import { mapTab } from '@colanode/client/lib';
import { eventBus } from '@colanode/client/lib/event-bus';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  TabDeleteMutationInput,
  TabDeleteMutationOutput,
} from '@colanode/client/mutations/apps/tab-delete';
import { AppService } from '@colanode/client/services/app-service';

export class TabDeleteMutationHandler
  implements MutationHandler<TabDeleteMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: TabDeleteMutationInput
  ): Promise<TabDeleteMutationOutput> {
    const deletedTab = await this.app.database
      .deleteFrom('tabs')
      .returningAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!deletedTab) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'tab.deleted',
      tab: mapTab(deletedTab),
    });

    return {
      success: true,
    };
  }
}
