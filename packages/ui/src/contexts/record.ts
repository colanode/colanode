import {
  BooleanFieldAttributes,
  CollaboratorFieldAttributes,
  DateFieldAttributes,
  EmailFieldAttributes,
  FieldAttributes,
  FieldValue,
  FileFieldAttributes,
  MultiSelectFieldAttributes,
  NumberFieldAttributes,
  PhoneFieldAttributes,
  RelationFieldAttributes,
  RollupFieldAttributes,
  SelectFieldAttributes,
  TextFieldAttributes,
  UrlFieldAttributes,
} from '@colanode/core';
import { createContext, useContext } from 'react';

interface RecordContext {
  id: string;
  name: string;
  avatar?: string | null;
  fields: Record<string, FieldValue>;
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  databaseId: string;
  canEdit: boolean;
  localRevision: string;
  updateFieldValue: (field: FieldAttributes, value: FieldValue) => void;
  removeFieldValue: (field: FieldAttributes) => void;
  getBooleanValue: (field: BooleanFieldAttributes) => boolean;
  getCollaboratorValue: (field: CollaboratorFieldAttributes) => string[] | null;
  getDateValue: (field: DateFieldAttributes) => Date | null;
  getEmailValue: (field: EmailFieldAttributes) => string | null;
  getFileValue: (field: FileFieldAttributes) => string[] | null;
  getMultiSelectValue: (field: MultiSelectFieldAttributes) => string[];
  getNumberValue: (field: NumberFieldAttributes) => number | null;
  getPhoneValue: (field: PhoneFieldAttributes) => string | null;
  getRelationValue: (field: RelationFieldAttributes) => string[] | null;
  getRollupValue: (field: RollupFieldAttributes) => string | null;
  getSelectValue: (field: SelectFieldAttributes) => string | null;
  getTextValue: (field: TextFieldAttributes) => string | null;
  getUrlValue: (field: UrlFieldAttributes) => string | null;
}

export const RecordContext = createContext<RecordContext>({} as RecordContext);

export const useRecord = () => useContext(RecordContext);
