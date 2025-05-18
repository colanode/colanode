import { Kysely } from 'kysely';

import { KyselyService } from './kysely-service';
import { FileSystem } from './file-system';
import { AppPaths } from './app-paths';

import { EmojiDatabaseSchema, IconDatabaseSchema } from '../databases';

export class AssetService {
  private readonly kysely: KyselyService;
  private readonly fs: FileSystem;
  private readonly paths: AppPaths;

  public emojis: Kysely<EmojiDatabaseSchema> | null = null;
  public icons: Kysely<IconDatabaseSchema> | null = null;

  constructor(kysely: KyselyService, fs: FileSystem, paths: AppPaths) {
    this.kysely = kysely;
    this.fs = fs;
    this.paths = paths;
  }

  public async init(): Promise<void> {
    await Promise.all([this.downloadEmojis(), this.downloadIcons()]);
  }

  private async initEmojisDatabase(): Promise<void> {
    if (this.emojis) {
      return;
    }

    await this.downloadEmojis();
    this.emojis = this.kysely.build<EmojiDatabaseSchema>(
      this.paths.emojisDatabase
    );
  }

  private async downloadEmojis(): Promise<void> {
    const fs = this.fs;
    const emojiDbPath = this.paths.emojisDatabase;

    const exists = await fs.exists(emojiDbPath);
    if (exists) {
      return;
    }

    try {
      const emojiResponse = await fetch('/emojis.db');
      if (!emojiResponse.ok) {
        throw new Error(
          `Failed to download emoji database: ${emojiResponse.status}`
        );
      }
      console.log('Downloading emojis...', emojiResponse.status);

      const emojiData = await emojiResponse.arrayBuffer();
      await fs.writeFile(emojiDbPath, new Uint8Array(emojiData));
    } catch (error) {
      console.error('Failed to download emojis:', error);
      throw error;
    }
  }

  private async initIconsDatabase(): Promise<void> {
    if (this.icons) {
      return;
    }

    await this.downloadIcons();
    this.icons = this.kysely.build<IconDatabaseSchema>(
      this.paths.iconsDatabase
    );
  }

  private async downloadIcons(): Promise<void> {
    const fs = this.fs;
    const iconDbPath = this.paths.iconsDatabase;

    const exists = await fs.exists(iconDbPath);
    if (exists) {
      return;
    }

    try {
      const iconResponse = await fetch('/icons.db');
      if (!iconResponse.ok) {
        throw new Error(
          `Failed to download icon database: ${iconResponse.status}`
        );
      }
      console.log('Downloading icons...', iconResponse.status);
      const iconData = await iconResponse.arrayBuffer();
      await fs.writeFile(iconDbPath, new Uint8Array(iconData));
    } catch (error) {
      console.error('Failed to download icons:', error);
      throw error;
    }
  }
}
