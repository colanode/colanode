import { net } from 'electron';
import fs from 'fs';
import path from 'path';

import { getAssetsSourcePath } from '@/main/utils';
import { EmojiData } from '@/shared/types/emojis';
import { IconData } from '@/shared/types/icons';

class AssetService {
  public async handleAssetRequest(request: Request): Promise<Response> {
    const url = request.url.replace('asset://', '');
    const assetPath = this.getAssetPath(url);
    const localFileUrl = `file://${assetPath}`;
    return net.fetch(localFileUrl);
  }

  private getAssetPath(url: string): string {
    return path.join(getAssetsSourcePath(), url);
  }

  public getEmojiData(): EmojiData {
    const emojisMetadataPath = path.join(
      getAssetsSourcePath(),
      'emojis',
      'emojis.json'
    );
    return JSON.parse(fs.readFileSync(emojisMetadataPath, 'utf8'));
  }

  public getIconData(): IconData {
    const iconsMetadataPath = path.join(
      getAssetsSourcePath(),
      'icons',
      'icons.json'
    );
    return JSON.parse(fs.readFileSync(iconsMetadataPath, 'utf8'));
  }
}

export const assetService = new AssetService();
