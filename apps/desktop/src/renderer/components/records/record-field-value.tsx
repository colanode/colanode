import { FieldAttributes } from '@colanode/core';
import { RecordTextValue } from '@/renderer/components/records/values/record-text-value';
import { RecordNumberValue } from '@/renderer/components/records/values/record-number-value';
import { RecordBooleanValue } from '@/renderer/components/records/values/record-boolean-value';
import { RecordCreatedAtValue } from '@/renderer/components/records/values/record-created-at-value';
import { RecordCreatedByValue } from '@/renderer/components/records/values/record-created-by-value';
import { RecordSelectValue } from '@/renderer/components/records/values/record-select-value';
import { RecordPhoneValue } from '@/renderer/components/records/values/record-phone-value';
import { RecordEmailValue } from '@/renderer/components/records/values/record-email-value';
import { RecordUrlValue } from '@/renderer/components/records/values/record-url-value';
import { RecordMultiSelectValue } from '@/renderer/components/records/values/record-multi-select-value';
import { RecordDateValue } from '@/renderer/components/records/values/record-date-value';
import { RecordCollaboratorValue } from '@/renderer/components/records/values/record-collaborator-value';

interface RecordFieldValueProps {
  field: FieldAttributes;
}

export const RecordFieldValue = ({ field }: RecordFieldValueProps) => {
  switch (field.type) {
    case 'boolean':
      return <RecordBooleanValue field={field} />;
    case 'createdAt':
      return <RecordCreatedAtValue field={field} />;
    case 'createdBy':
      return <RecordCreatedByValue field={field} />;
    case 'collaborator':
      return <RecordCollaboratorValue field={field} />;
    case 'date':
      return <RecordDateValue field={field} />;
    case 'email':
      return <RecordEmailValue field={field} />;
    case 'multiSelect':
      return <RecordMultiSelectValue field={field} />;
    case 'number':
      return <RecordNumberValue field={field} />;
    case 'phone':
      return <RecordPhoneValue field={field} />;
    case 'select':
      return <RecordSelectValue field={field} />;
    case 'text':
      return <RecordTextValue field={field} />;
    case 'url':
      return <RecordUrlValue field={field} />;
    default:
      return null;
  }
};
