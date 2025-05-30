import { Kysely } from 'kysely';

import {
  EmojiDatabaseSchema,
  IconDatabaseSchema,
} from '@colanode/client/databases';
import { AppService } from '@colanode/client/services/app-service';

export class AssetService {
  private readonly app: AppService;

  public readonly emojis: Kysely<EmojiDatabaseSchema>;
  public readonly icons: Kysely<IconDatabaseSchema>;

  constructor(app: AppService) {
    this.app = app;

    this.emojis = this.app.kysely.build<EmojiDatabaseSchema>({
      path: this.app.path.emojisDatabase,
      readonly: true,
    });
    this.icons = this.app.kysely.build<IconDatabaseSchema>({
      path: this.app.path.iconsDatabase,
      readonly: true,
    });
  }
}
