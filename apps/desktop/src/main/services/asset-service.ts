import { app, net } from 'electron';
import path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import { EmojiData } from '@/shared/types/emojis';
import { IconData } from '@/shared/types/icons';

type AssetsVersion = {
  date: string;
  emojis: string;
  icons: string;
};

const EMOJIS_VERSION = '1.0.0';
const ICONS_VERSION = '1.0.0';

class AssetService {
  private readonly assetsDir: string;

  constructor() {
    this.assetsDir = path.join(app.getPath('userData'), 'assets');
  }

  public async handleAssetRequest(request: Request): Promise<Response> {
    const url = request.url.replace('asset://', '');
    const assetPath = this.getAssetPath(url);
    const localFileUrl = `file://${assetPath}`;
    return net.fetch(localFileUrl);
  }

  private getAssetPath(url: string): string {
    if (url.includes('emojis') || url.includes('icons')) {
      return path.join(this.assetsDir, url);
    }

    return path.join(__dirname, 'assets', url);
  }

  public getEmojiData(): EmojiData {
    const emojisDir = path.join(this.assetsDir, 'emojis');
    const emojisMetadataPath = path.join(emojisDir, 'emojis.json');
    return JSON.parse(fs.readFileSync(emojisMetadataPath, 'utf8'));
  }

  public getIconData(): IconData {
    const iconsDir = path.join(this.assetsDir, 'icons');
    const iconsMetadataPath = path.join(iconsDir, 'icons.json');
    return JSON.parse(fs.readFileSync(iconsMetadataPath, 'utf8'));
  }

  public async checkAssets(): Promise<void> {
    if (!this.shouldUpdateAssets()) {
      return;
    }

    await this.updateAssets();
  }

  private async updateAssets(): Promise<void> {
    await this.updateEmojis();
    await this.updateIcons();

    this.writeAssetsVersion();
  }

  private async updateEmojis(): Promise<void> {
    const emojisZipPath = path.join(this.getAssetsSourcePath(), 'emojis.zip');
    const emojisDir = path.join(this.assetsDir, 'emojis');
    if (fs.existsSync(emojisDir)) {
      fs.rmSync(emojisDir, { recursive: true });
    }

    fs.mkdirSync(emojisDir, { recursive: true });
    await fs
      .createReadStream(emojisZipPath)
      .pipe(unzipper.Extract({ path: emojisDir }))
      .promise();
  }

  private async updateIcons(): Promise<void> {
    const iconsZipPath = path.join(this.getAssetsSourcePath(), 'icons.zip');
    const iconsDir = path.join(this.assetsDir, 'icons');
    if (fs.existsSync(iconsDir)) {
      fs.rmSync(iconsDir, { recursive: true });
    }

    fs.mkdirSync(iconsDir, { recursive: true });
    await fs
      .createReadStream(iconsZipPath)
      .pipe(unzipper.Extract({ path: iconsDir }))
      .promise();
  }

  private shouldUpdateAssets(): boolean {
    const assetsVersion = this.readAssetsVersion();
    if (!assetsVersion) {
      return true;
    }

    return (
      assetsVersion.emojis !== EMOJIS_VERSION ||
      assetsVersion.icons !== ICONS_VERSION
    );
  }

  private readAssetsVersion(): AssetsVersion | null {
    const assetsVersionPath = path.join(this.assetsDir, 'version.json');
    if (!fs.existsSync(assetsVersionPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(assetsVersionPath, 'utf8'));
  }

  private writeAssetsVersion(): void {
    const assetsVersionPath = path.join(this.assetsDir, 'version.json');
    fs.writeFileSync(
      assetsVersionPath,
      JSON.stringify({
        date: new Date().toISOString(),
        emojis: EMOJIS_VERSION,
        icons: ICONS_VERSION,
      })
    );
  }

  private getAssetsSourcePath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'assets');
    }

    return path.resolve(__dirname, '../../assets');
  }
}

export const assetService = new AssetService();
