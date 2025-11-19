import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { EmojiSvgGetQueryInput } from '@colanode/client/queries/emojis/emoji-svg-get';
import { AppService } from '@colanode/client/services/app-service';
import { bytesToString } from '@colanode/core';

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
    const row = await this.app.assets.emojis
      .selectFrom('emoji_svgs')
      .select('svg')
      .where('skin_id', '=', input.id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    const svg = bytesToString(row.svg);
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
