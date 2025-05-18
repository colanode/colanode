import { Kysely } from 'kysely';

import { AppService } from './app-service';

import { EmojiDatabaseSchema, IconDatabaseSchema } from '../databases';

export class AssetService {
  private readonly app: AppService;

  public readonly emojis: Kysely<EmojiDatabaseSchema>;
  public readonly icons: Kysely<IconDatabaseSchema>;

  constructor(app: AppService) {
    this.app = app;

    this.emojis = this.app.kysely.build<EmojiDatabaseSchema>(
      this.app.paths.emojisDatabase
    );
    this.icons = this.app.kysely.build<IconDatabaseSchema>(
      this.app.paths.iconsDatabase
    );
  }

  // public async init(): Promise<void> {
  //   await Promise.all([this.initEmojisDatabase(), this.initIconsDatabase()]);
  // }

  // private async initEmojisDatabase(): Promise<void> {
  //   if (this.emojis) {
  //     return;
  //   }

  //   await this.downloadEmojis();
  //   this.emojisDb = this.app.kysely.build<EmojiDatabaseSchema>(
  //     this.app.paths.emojisDatabase
  //   );
  // }

  // private async downloadEmojis(): Promise<void> {
  //   const fs = this.app.fs;
  //   const emojiDbPath = this.app.paths.emojisDatabase;

  //   const exists = await fs.exists(emojiDbPath);
  //   if (exists) {
  //     return;
  //   }

  //   try {
  //     const emojiResponse = await fetch('/assets/emojis.db');
  //     if (!emojiResponse.ok) {
  //       throw new Error(
  //         `Failed to download emoji database: ${emojiResponse.status}`
  //       );
  //     }
  //     console.log('Downloading emojis...', emojiResponse.status);

  //     const emojiData = await emojiResponse.arrayBuffer();
  //     await fs.writeFile(emojiDbPath, new Uint8Array(emojiData));
  //   } catch (error) {
  //     console.error('Failed to download emojis:', error);
  //     throw error;
  //   }
  // }

  // private async initIconsDatabase(): Promise<void> {
  //   if (this.iconsDb) {
  //     return;
  //   }

  //   await this.downloadIcons();
  //   this.iconsDb = this.app.kysely.build<IconDatabaseSchema>(
  //     this.app.paths.iconsDatabase
  //   );
  // }

  // private async downloadIcons(): Promise<void> {
  //   const fs = this.app.fs;
  //   const iconDbPath = this.app.paths.iconsDatabase;

  //   const exists = await fs.exists(iconDbPath);
  //   if (exists) {
  //     return;
  //   }

  //   try {
  //     const iconResponse = await fetch('/assets/icons.db');
  //     if (!iconResponse.ok) {
  //       throw new Error(
  //         `Failed to download icon database: ${iconResponse.status}`
  //       );
  //     }
  //     console.log('Downloading icons...', iconResponse.status);
  //     const iconData = await iconResponse.arrayBuffer();
  //     await fs.writeFile(iconDbPath, new Uint8Array(iconData));
  //   } catch (error) {
  //     console.error('Failed to download icons:', error);
  //     throw error;
  //   }
  // }
}
