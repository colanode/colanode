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

    const emoji = await app.asset.emojis
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

    const icon = await app.asset.icons
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

  if (type === 'avatars') {
    const accountId = parts[1];
    const avatarId = parts[2];

    if (!accountId || !avatarId) {
      return new Response(null, { status: 400 });
    }

    const avatarPath = app.path.accountAvatar(accountId, avatarId);
    const avatarUrl = `file://${avatarPath}`;
    const subRequest = new Request(avatarUrl, request);

    const avatarExists = await app.fs.exists(avatarPath);
    if (avatarExists) {
      return net.fetch(subRequest);
    }

    const account = app.getAccount(accountId);
    if (!account) {
      return new Response(null, { status: 404 });
    }

    const downloaded = await account.downloadAvatar(avatarId);
    if (!downloaded) {
      return new Response(null, { status: 404 });
    }

    return net.fetch(subRequest);
  }

  if (type === 'files') {
    const accountId = parts[1];
    const workspaceId = parts[2];
    const fileId = parts[3];

    if (!accountId || !workspaceId || !fileId) {
      return new Response(null, { status: 400 });
    }

    const account = app.getAccount(accountId);
    if (!account) {
      return new Response(null, { status: 404 });
    }

    const workspace = account.getWorkspace(workspaceId);
    if (!workspace) {
      return new Response(null, { status: 404 });
    }

    const file = await workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!file) {
      return new Response(null, { status: 404 });
    }

    const fileUrl = `file://${file.path}`;
    const subRequest = new Request(fileUrl, request);
    return net.fetch(subRequest);
  }

  if (type === 'temp') {
    const name = parts[1];
    if (!name) {
      return new Response(null, { status: 400 });
    }

    const filePath = app.path.tempFile(name);
    const fileUrl = `file://${filePath}`;
    const subRequest = new Request(fileUrl, request);
    return net.fetch(subRequest);
  }

  return new Response(null, { status: 404 });
};
