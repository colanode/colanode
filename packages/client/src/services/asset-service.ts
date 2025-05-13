import { Kysely } from 'kysely';
import { net } from 'electron';

import path from 'path';

import { AppService } from './app-service';

import { EmojiDatabaseSchema, IconDatabaseSchema } from '../databases';

export class AssetService {
  private readonly app: AppService;

  public readonly emojis: Kysely<EmojiDatabaseSchema>;
  public readonly icons: Kysely<IconDatabaseSchema>;

  constructor(app: AppService) {
    this.app = app;
    this.emojis = app.kysely.build<EmojiDatabaseSchema>(
      app.paths.emojisDatabase
    );
    this.icons = app.kysely.build<IconDatabaseSchema>(app.paths.iconsDatabase);
  }

  public async handleAssetRequest(request: Request): Promise<Response> {
    const url = request.url.replace('asset://', '');
    const [type, id] = url.split('/');
    if (!type || !id) {
      return new Response(null, { status: 400 });
    }

    if (type === 'emojis') {
      const emoji = await this.emojis
        .selectFrom('emoji_svgs')
        .selectAll()
        .where('skin_id', '=', id)
        .executeTakeFirst();

      if (emoji) {
        return new Response(emoji.svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
          },
        });
      }
    }

    if (type === 'icons') {
      const icon = await this.icons
        .selectFrom('icon_svgs')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (icon) {
        return new Response(icon.svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
          },
        });
      }
    }

    if (type === 'fonts') {
      const filePath = path.join(this.app.paths.fonts, id);
      const fileUrl = `file://${filePath}`;
      return net.fetch(fileUrl);
    }

    return new Response(null, { status: 404 });
  }
}
