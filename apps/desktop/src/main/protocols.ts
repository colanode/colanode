import { net } from 'electron';
import fs from 'fs';
import path from 'path';

import { app } from '@colanode/desktop/main/app-service';

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

export const handleAvatarRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('avatar://', '');
  const [accountId, avatarId] = url.split('/');
  if (!accountId || !avatarId) {
    return new Response(null, { status: 400 });
  }

  const avatarPath = app.path.accountAvatar(accountId, avatarId);
  const avatarLocalUrl = `file://${avatarPath}`;

  if (!fs.existsSync(avatarPath)) {
    return new Response(null, { status: 404 });
  }

  return net.fetch(avatarLocalUrl);
};

export const handleTempFileRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('temp-file://', 'file://');
  return net.fetch(url);
};

export const handleFileRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('local-file://', '');
  const [accountId, workspaceId, file] = url.split('/');
  if (!accountId || !workspaceId || !file) {
    return new Response(null, { status: 400 });
  }

  const workspaceFilesDir = app.path.workspaceFiles(accountId, workspaceId);
  const filePath = path.join(workspaceFilesDir, file);

  if (fs.existsSync(filePath)) {
    const fileUrl = `file://${filePath}`;
    return net.fetch(fileUrl);
  }

  return new Response(null, { status: 404 });
};
