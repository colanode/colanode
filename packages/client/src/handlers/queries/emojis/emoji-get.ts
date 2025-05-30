import { mapEmoji } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { EmojiGetQueryInput } from '@colanode/client/queries/emojis/emoji-get';
import { AppService } from '@colanode/client/services/app-service';
import { Emoji } from '@colanode/client/types/emojis';
import { Event } from '@colanode/client/types/events';

export class EmojiGetQueryHandler implements QueryHandler<EmojiGetQueryInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(input: EmojiGetQueryInput): Promise<Emoji | null> {
    if (!this.app.asset.emojis) {
      return null;
    }

    const data = await this.app.asset.emojis
      .selectFrom('emojis')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!data) {
      return null;
    }

    const emoji = mapEmoji(data);
    return emoji;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiGetQueryInput,
    ___: Emoji | null
  ): Promise<ChangeCheckResult<EmojiGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
