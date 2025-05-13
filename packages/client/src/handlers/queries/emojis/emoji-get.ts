import { mapEmoji } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiGetQueryInput } from '../../../queries/emojis/emoji-get';
import { Emoji } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AppService } from '../../../services/app-service';

export class EmojiGetQueryHandler implements QueryHandler<EmojiGetQueryInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(input: EmojiGetQueryInput): Promise<Emoji> {
    const data = await this.app.asset.emojis
      .selectFrom('emojis')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!data) {
      throw new Error('Emoji not found');
    }

    const emoji = mapEmoji(data);
    return emoji;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiGetQueryInput,
    ___: Emoji
  ): Promise<ChangeCheckResult<EmojiGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
