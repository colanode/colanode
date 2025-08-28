import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { EmojiSvgGetQueryInput } from '@colanode/client/queries/emojis/emoji-svg-get';
import { AppService } from '@colanode/client/services/app-service';

export class EmojiSvgGetQueryHandler
  implements QueryHandler<EmojiSvgGetQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    input: EmojiSvgGetQueryInput
  ): Promise<string | null> {
    if (!this.app.assets.emojis) {
      return null;
    }

    const row = await this.app.assets.emojis
      .selectFrom('emoji_svgs')
      .select('svg')
      .where('skin_id', '=', input.id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    const svg = row.svg.toString('utf-8');
    return svg;
  }

  public async checkForChanges(): Promise<
    ChangeCheckResult<EmojiSvgGetQueryInput>
  > {
    return {
      hasChanges: false,
    };
  }
}
