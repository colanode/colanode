import { Kysely } from 'kysely';

import { AppService } from './app-service';

import { EmojiDatabaseSchema, IconDatabaseSchema } from '../databases';

export class AssetService {
  private readonly app: AppService;

  public readonly emojis: Kysely<EmojiDatabaseSchema>;
  public readonly icons: Kysely<IconDatabaseSchema>;

  constructor(app: AppService) {
    this.app = app;

    this.emojis = this.app.kysely.build<EmojiDatabaseSchema>({
      path: this.app.paths.emojisDatabase,
      readonly: true,
    });
    this.icons = this.app.kysely.build<IconDatabaseSchema>({
      path: this.app.paths.iconsDatabase,
      readonly: true,
    });
  }
}
