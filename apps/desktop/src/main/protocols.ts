import { net } from 'electron';
import path from 'path';

import { app } from '@colanode/desktop/main/app-service';

export const handleLocalRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('local://', '');
  const parts = url.split('/');

  const type = parts[0];
  if (!type) {
    return new Response(null, { status: 400 });
  }

  if (type === 'emojis') {
    const skinId = parts[1];
    if (!skinId) {
      return new Response(null, { status: 400 });
    }

    const emoji = await app.assets.emojis
      .selectFrom('emoji_svgs')
      .selectAll()
      .where('skin_id', '=', skinId)
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
    const iconId = parts[1];
    if (!iconId) {
      return new Response(null, { status: 400 });
    }

    const icon = await app.assets.icons
      .selectFrom('icon_svgs')
      .selectAll()
      .where('id', '=', iconId)
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
    const fontName = parts[1];
    if (!fontName) {
      return new Response(null, { status: 400 });
    }

    const filePath = path.join(app.path.assets, 'fonts', fontName);
    const fileUrl = `file://${filePath}`;
    const subRequest = new Request(fileUrl, request);
    return net.fetch(subRequest);
  }

  if (type === 'files') {
    const base64Path = parts[1];
    if (!base64Path) {
      return new Response(null, { status: 400 });
    }

    const path = Buffer.from(base64Path, 'base64').toString('utf-8');
    const fileUrl = `file://${path}`;
    const subRequest = new Request(fileUrl, request);
    return net.fetch(subRequest);
  }

  return new Response(null, { status: 404 });
};
