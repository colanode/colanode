import { net } from 'electron';
import path from 'path';

import { app } from '@colanode/desktop/main/app-service';
import { DesktopFileSystem } from '@colanode/desktop/main/file-system';

export const handleAssetRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('asset://', '');
  const [type, id] = url.split('/');
  if (!type || !id) {
    return new Response(null, { status: 400 });
  }

  if (type === 'emojis') {
    const emoji = await app.asset.emojis
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
    const icon = await app.asset.icons
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
    const filePath = path.join(app.path.assets, 'fonts', id);
    const fileUrl = `file://${filePath}`;
    return net.fetch(fileUrl);
  }

  return new Response(null, { status: 404 });
};

export const handleFileRequest = async (
  request: Request
): Promise<Response> => {
  return net.fetch(`file://${DesktopFileSystem.win32PathPreUrl(
      request.url.replace('local-file://', '')
    )}`
  );
};
