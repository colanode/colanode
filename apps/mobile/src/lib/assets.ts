import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';

import { PathService } from '@colanode/client/services';

import emojisDatabaseAsset from '../../assets/emojis.db';
import antonioFontAsset from '../../assets/fonts/antonio.ttf';
import iconsDatabaseAsset from '../../assets/icons.db';

export { emojisDatabaseAsset, iconsDatabaseAsset, antonioFontAsset };

export const copyAssets = async (paths: PathService) => {
  try {
    const assetsDir = new Directory(paths.assets);
    assetsDir.create({ intermediates: true, idempotent: true });

    const fontsDir = new Directory(paths.fonts);
    fontsDir.create({ intermediates: true, idempotent: true });

    await copyAsset(
      Asset.fromModule(emojisDatabaseAsset),
      paths.emojisDatabase
    );
    await copyAsset(Asset.fromModule(iconsDatabaseAsset), paths.iconsDatabase);
    await copyAsset(
      Asset.fromModule(antonioFontAsset),
      paths.font('antonio.ttf')
    );
  } catch (error) {
    console.error(error);
  }
};

export const copyAsset = async (asset: Asset, path: string) => {
  await asset.downloadAsync();
  const localUri = asset.localUri ?? asset.uri;

  const dest = new File(path);
  if (dest.exists) {
    dest.delete();
  }

  const assetFile = new File(localUri);
  assetFile.copy(dest);
};
