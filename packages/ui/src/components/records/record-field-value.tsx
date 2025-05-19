import { FieldAttributes } from '@colanode/core';
import { RecordBooleanValue } from '@colanode/ui/components/records/values/record-boolean-value';
import { RecordCollaboratorValue } from '@colanode/ui/components/records/values/record-collaborator-value';
import { RecordCreatedAtValue } from '@colanode/ui/components/records/values/record-created-at-value';
import { RecordCreatedByValue } from '@colanode/ui/components/records/values/record-created-by-value';
import { RecordDateValue } from '@colanode/ui/components/records/values/record-date-value';
import { RecordEmailValue } from '@colanode/ui/components/records/values/record-email-value';
import { RecordMultiSelectValue } from '@colanode/ui/components/records/values/record-multi-select-value';
import { RecordNumberValue } from '@colanode/ui/components/records/values/record-number-value';
import { RecordPhoneValue } from '@colanode/ui/components/records/values/record-phone-value';
import { RecordRelationValue } from '@colanode/ui/components/records/values/record-relation-value';
import { RecordSelectValue } from '@colanode/ui/components/records/values/record-select-value';
import { RecordTextValue } from '@colanode/ui/components/records/values/record-text-value';
import { RecordUpdatedAtValue } from '@colanode/ui/components/records/values/record-updated-at-value';
import { RecordUpdatedByValue } from '@colanode/ui/components/records/values/record-updated-by-value';
import { RecordUrlValue } from '@colanode/ui/components/records/values/record-url-value';

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
    case 'created_at':
      return <RecordCreatedAtValue field={field} />;
    case 'created_by':
      return <RecordCreatedByValue field={field} />;
    case 'collaborator':
      return <RecordCollaboratorValue field={field} readOnly={readOnly} />;
    case 'date':
      return <RecordDateValue field={field} readOnly={readOnly} />;
    case 'email':
      return <RecordEmailValue field={field} readOnly={readOnly} />;
    case 'multi_select':
      return <RecordMultiSelectValue field={field} readOnly={readOnly} />;
    case 'number':
      return <RecordNumberValue field={field} readOnly={readOnly} />;
    case 'phone':
      return <RecordPhoneValue field={field} readOnly={readOnly} />;
    case 'select':
      return <RecordSelectValue field={field} readOnly={readOnly} />;
    case 'relation':
      return <RecordRelationValue field={field} readOnly={readOnly} />;
    case 'text':
      return <RecordTextValue field={field} readOnly={readOnly} />;
    case 'url':
      return <RecordUrlValue field={field} readOnly={readOnly} />;
    case 'updated_at':
      return <RecordUpdatedAtValue field={field} />;
    case 'updated_by':
      return <RecordUpdatedByValue field={field} />;
    default:
      return null;
  }
};
