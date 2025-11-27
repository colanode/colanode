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
  state: string;
};

export type DocumentUpdate = {
  id: string;
  documentId: string;
  data: string;
};
