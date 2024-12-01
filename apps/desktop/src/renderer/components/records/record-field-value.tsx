import { FieldAttributes } from '@colanode/core';

import { RecordBooleanValue } from '@/renderer/components/records/values/record-boolean-value';
import { RecordCollaboratorValue } from '@/renderer/components/records/values/record-collaborator-value';
import { RecordCreatedAtValue } from '@/renderer/components/records/values/record-created-at-value';
import { RecordCreatedByValue } from '@/renderer/components/records/values/record-created-by-value';
import { RecordDateValue } from '@/renderer/components/records/values/record-date-value';
import { RecordEmailValue } from '@/renderer/components/records/values/record-email-value';
import { RecordMultiSelectValue } from '@/renderer/components/records/values/record-multi-select-value';
import { RecordNumberValue } from '@/renderer/components/records/values/record-number-value';
import { RecordPhoneValue } from '@/renderer/components/records/values/record-phone-value';
import { RecordSelectValue } from '@/renderer/components/records/values/record-select-value';
import { RecordTextValue } from '@/renderer/components/records/values/record-text-value';
import { RecordUpdatedAtValue } from '@/renderer/components/records/values/record-updated-at-value';
import { RecordUpdatedByValue } from '@/renderer/components/records/values/record-updated-by-value';
import { RecordUrlValue } from '@/renderer/components/records/values/record-url-value';

interface RecordFieldValueProps {
  field: FieldAttributes;
  readOnly?: boolean;
}

export const RecordFieldValue = ({
  field,
  readOnly,
}: RecordFieldValueProps) => {
  switch (field.type) {
    case 'boolean':
      return <RecordBooleanValue field={field} readOnly={readOnly} />;
    case 'createdAt':
      return <RecordCreatedAtValue field={field} />;
    case 'createdBy':
      return <RecordCreatedByValue field={field} />;
    case 'collaborator':
      return <RecordCollaboratorValue field={field} readOnly={readOnly} />;
    case 'date':
      return <RecordDateValue field={field} readOnly={readOnly} />;
    case 'email':
      return <RecordEmailValue field={field} readOnly={readOnly} />;
    case 'multiSelect':
      return <RecordMultiSelectValue field={field} readOnly={readOnly} />;
    case 'number':
      return <RecordNumberValue field={field} readOnly={readOnly} />;
    case 'phone':
      return <RecordPhoneValue field={field} readOnly={readOnly} />;
    case 'select':
      return <RecordSelectValue field={field} readOnly={readOnly} />;
    case 'text':
      return <RecordTextValue field={field} readOnly={readOnly} />;
    case 'url':
      return <RecordUrlValue field={field} readOnly={readOnly} />;
    case 'updatedAt':
      return <RecordUpdatedAtValue field={field} />;
    case 'updatedBy':
      return <RecordUpdatedByValue field={field} />;
    default:
      return null;
  }
};
