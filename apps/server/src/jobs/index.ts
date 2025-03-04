import { cleanNodeDataHandler } from '@/jobs/clean-node-data';
import { cleanWorkspaceDataHandler } from '@/jobs/clean-workspace-data';
import { JobHandler, JobMap } from '@/types/jobs';
import { sendEmailVerifyEmailHandler } from '@/jobs/send-email-verify-email';
import { embedNodeHandler } from '@/jobs/embed-node';
import { embedDocumentHandler } from '@/jobs/embed-document';
import { assistantResponseHandler } from '@/jobs/assistant-response';
import { checkNodeEmbeddingsHandler } from '@/jobs/check-node-embeddings';
import { checkDocumentEmbeddingsHandler } from '@/jobs/check-document-embeddings';

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  send_email_verify_email: sendEmailVerifyEmailHandler,
  clean_workspace_data: cleanWorkspaceDataHandler,
  clean_node_data: cleanNodeDataHandler,
  embed_node: embedNodeHandler,
  embed_document: embedDocumentHandler,
  assistant_response: assistantResponseHandler,
  check_node_embeddings: checkNodeEmbeddingsHandler,
  check_document_embeddings: checkDocumentEmbeddingsHandler,
};
