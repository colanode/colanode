import { database } from '@/data/database';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';
import { hasCollaboratorAccess, hasViewerAccess } from '@/lib/constants';
import { fetchNodeRole } from '@/lib/nodes';
import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Router } from 'express';
import {
  CreateDownloadOutput,
  CreateUploadInput,
  CreateUploadOutput,
  extractFileType,
  generateId,
  IdType,
  UploadMetadata,
} from '@colanode/core';
import { redis } from '@/data/redis';
import { YDoc } from '@colanode/crdt';
import { enqueueEvent } from '@/queues/events';

export const filesRouter = Router();

filesRouter.get(
  '/:workspaceId/:fileId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const fileId = req.params.fileId as string;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const role = await fetchNodeRole(fileId, workspaceUser.id);
    if (role === null || !hasCollaboratorAccess(role)) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const node = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!node) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'File not found.',
      });
    }

    if (node.attributes.type !== 'file') {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'File not found.',
      });
    }

    // check if the upload is completed
    const upload = await database
      .selectFrom('uploads')
      .selectAll()
      .where('node_id', '=', fileId)
      .executeTakeFirst();

    if (!upload) {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Upload not completed.',
      });
    }

    //generate presigned url for download
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAMES.FILES,
      Key: upload.path,
    });

    const presignedUrl = await getSignedUrl(filesStorage, command, {
      expiresIn: 60 * 60 * 4, // 4 hours
    });

    const output: CreateDownloadOutput = {
      url: presignedUrl,
    };

    res.status(200).json(output);
  }
);

filesRouter.post(
  '/:workspaceId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const input = req.body as CreateUploadInput;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const node = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!node) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'File not found.',
      });
    }

    if (node.attributes.type !== 'file') {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'File not found.',
      });
    }

    if (node.created_by !== workspaceUser.id) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    //generate presigned url for upload
    const path = `files/${workspaceId}/${input.fileId}_${input.uploadId}${node.attributes.extension}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAMES.FILES,
      Key: path,
      ContentLength: node.attributes.size,
      ContentType: node.attributes.mimeType,
    });

    const expiresIn = 60 * 60 * 4; // 4 hours
    const presignedUrl = await getSignedUrl(filesStorage, command, {
      expiresIn,
    });

    const data: UploadMetadata = {
      fileId: input.fileId,
      path,
      mimeType: node.attributes.mimeType,
      size: node.attributes.size,
      uploadId: input.uploadId,
      createdAt: new Date().toISOString(),
    };

    await redis.set(input.uploadId, JSON.stringify(data), {
      EX: expiresIn,
    });

    const output: CreateUploadOutput = {
      uploadId: input.uploadId,
      url: presignedUrl,
    };

    res.status(200).json(output);
  }
);

filesRouter.put(
  '/:workspaceId/:uploadId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const uploadId = req.params.uploadId as string;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const metadataJson = await redis.get(uploadId);
    if (!metadataJson) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Upload not found.',
      });
    }

    const metadata: UploadMetadata = JSON.parse(metadataJson);
    const file = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', metadata.fileId)
      .executeTakeFirst();

    if (!file) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'File not found.',
      });
    }

    if (file.attributes.type !== 'file') {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'File not found.',
      });
    }

    if (file.attributes.size !== metadata.size) {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Size mismatch.',
      });
    }

    const path = metadata.path;
    // check if the file exists in the bucket
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAMES.FILES,
      Key: path,
    });

    try {
      const headObject = await filesStorage.send(command);

      // Verify file size matches expected size
      if (headObject.ContentLength !== metadata.size) {
        return res.status(400).json({
          code: ApiError.BadRequest,
          message: 'Uploaded file size does not match expected size',
        });
      }

      // Verify mime type matches expected type
      if (headObject.ContentType !== metadata.mimeType) {
        return res.status(400).json({
          code: ApiError.BadRequest,
          message: 'Uploaded file type does not match expected type',
        });
      }
    } catch (error) {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'File upload verification failed',
      });
    }

    const ydoc = new YDoc(file.id, file.state);
    ydoc.updateAttributes({
      ...file.attributes,
      uploadStatus: 'completed',
      uploadId: metadata.uploadId,
    });

    const attributes = ydoc.getAttributes();
    const state = ydoc.getState();
    const fileVersionId = generateId(IdType.Version);
    const updatedAt = new Date();

    await database.transaction().execute(async (tx) => {
      await database
        .insertInto('uploads')
        .values({
          node_id: file.id,
          upload_id: uploadId,
          workspace_id: workspace.id,
          path: metadata.path,
          mime_type: metadata.mimeType,
          size: metadata.size,
          type: extractFileType(metadata.mimeType),
          created_by: workspaceUser.id,
          created_at: new Date(metadata.createdAt),
          completed_at: updatedAt,
        })
        .execute();

      await tx
        .updateTable('nodes')
        .set({
          attributes: JSON.stringify(attributes),
          state: state,
          updated_at: updatedAt,
          updated_by: workspaceUser.id,
          version_id: fileVersionId,
          server_updated_at: updatedAt,
        })
        .where('id', '=', file.id)
        .execute();
    });

    await enqueueEvent({
      type: 'node_updated',
      id: file.id,
      workspaceId: workspace.id,
      beforeAttributes: file.attributes,
      afterAttributes: attributes,
      updatedBy: workspaceUser.id,
      updatedAt: updatedAt.toISOString(),
      serverUpdatedAt: updatedAt.toISOString(),
      versionId: fileVersionId,
    });

    await redis.del(uploadId);

    res.status(200).json({ success: true });
  }
);
