import { assistantRespondHandler } from '@colanode/server/jobs/assistant-response';
import { documentEmbedHandler } from '@colanode/server/jobs/document-embed';
import { documentEmbedScanHandler } from '@colanode/server/jobs/document-embed-scan';
import { documentUpdatesMergeHandler } from '@colanode/server/jobs/document-updates-merge';
import { emailPasswordResetSendHandler } from '@colanode/server/jobs/email-password-reset-sent';
import { emailVerifySendHandler } from '@colanode/server/jobs/email-verify-send';
import { nodeCleanHandler } from '@colanode/server/jobs/node-clean';
import { nodeEmbedHandler } from '@colanode/server/jobs/node-embed';
import { nodeEmbedScanHandler } from '@colanode/server/jobs/node-embed-scan';
import { nodeUpdatesMergeHandler } from '@colanode/server/jobs/node-updates-merge';
import { workspaceCleanHandler } from '@colanode/server/jobs/workspace-clean';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JobMap {}

export type JobInput = JobMap[keyof JobMap]['input'];

export type JobHandler<T extends JobInput> = (input: T) => Promise<void>;

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  'email.verify.send': emailVerifySendHandler,
  'email.password.reset.send': emailPasswordResetSendHandler,
  'workspace.clean': workspaceCleanHandler,
  'node.clean': nodeCleanHandler,
  'node.embed': nodeEmbedHandler,
  'document.embed': documentEmbedHandler,
  'assistant.respond': assistantRespondHandler,
  'node.embed.scan': nodeEmbedScanHandler,
  'document.embed.scan': documentEmbedScanHandler,
  'node.updates.merge': nodeUpdatesMergeHandler,
  'document.updates.merge': documentUpdatesMergeHandler,
};
