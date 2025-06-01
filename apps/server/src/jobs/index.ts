import { assistantResponseHandler } from '@colanode/server/jobs/assistant-response';
import { checkDocumentEmbeddingsHandler } from '@colanode/server/jobs/check-document-embeddings';
import { checkNodeEmbeddingsHandler } from '@colanode/server/jobs/check-node-embeddings';
import { cleanNodeDataHandler } from '@colanode/server/jobs/clean-node-data';
import { cleanWorkspaceDataHandler } from '@colanode/server/jobs/clean-workspace-data';
import { embedDocumentHandler } from '@colanode/server/jobs/embed-document';
import { embedNodeHandler } from '@colanode/server/jobs/embed-node';
import { sendEmailPasswordResetEmailHandler } from '@colanode/server/jobs/send-email-password-reset-email';
import { sendEmailVerifyEmailHandler } from '@colanode/server/jobs/send-email-verify-email';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JobMap {}

export type JobInput = JobMap[keyof JobMap]['input'];

export type JobHandler<T extends JobInput> = (input: T) => Promise<void>;

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  send_email_verify_email: sendEmailVerifyEmailHandler,
  send_email_password_reset_email: sendEmailPasswordResetEmailHandler,
  clean_workspace_data: cleanWorkspaceDataHandler,
  clean_node_data: cleanNodeDataHandler,
  embed_node: embedNodeHandler,
  embed_document: embedDocumentHandler,
  assistant_response: assistantResponseHandler,
  check_node_embeddings: checkNodeEmbeddingsHandler,
  check_document_embeddings: checkDocumentEmbeddingsHandler,
};
