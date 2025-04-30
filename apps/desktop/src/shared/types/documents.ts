import { DocumentContent } from '@colanode/core';

export type Document = {
  id: string;
  localRevision: string;
  serverRevision: string;
  content: DocumentContent;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type DocumentState = {
  id: string;
  revision: string;
  state: Uint8Array;
};

export type DocumentUpdate = {
  id: string;
  documentId: string;
  data: Uint8Array;
};
