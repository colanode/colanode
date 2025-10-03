import { mapTab } from '@colanode/client/lib';
import { eventBus } from '@colanode/client/lib/event-bus';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  TabCreateMutationInput,
  TabCreateMutationOutput,
} from '@colanode/client/mutations/apps/tab-create';
import { AppService } from '@colanode/client/services/app-service';

export class TabCreateMutationHandler
  implements MutationHandler<TabCreateMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: TabCreateMutationInput
  ): Promise<TabCreateMutationOutput> {
    const createdTab = await this.app.database
      .insertInto('tabs')
      .returningAll()
      .values({
        id: input.id,
        location: input.location,
        index: input.index,
        created_at: new Date().toISOString(),
      })
      .onConflict((cb) =>
        cb.columns(['id']).doUpdateSet({
          location: input.location,
          index: input.index,
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdTab) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'tab.created',
      tab: mapTab(createdTab),
    });

    return {
      success: true,
    };
  }
}
