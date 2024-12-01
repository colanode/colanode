import { FieldType } from '@colanode/core';
import {
  Calendar,
  File,
  Hash,
  Link,
  ListCheck,
  ListChecks,
  Mail,
  ShieldQuestion,
  Smartphone,
  SquareCheck,
  Text,
  User,
} from 'lucide-react';

interface FieldIconProps {
  type?: FieldType;
  className?: string;
}

export const FieldIcon = ({ type, className }: FieldIconProps) => {
  switch (type) {
    case 'boolean':
      return <SquareCheck className={className} />;
    case 'collaborator':
      return <User className={className} />;
    case 'createdAt':
      return <Calendar className={className} />;
    case 'createdBy':
      return <User className={className} />;
    case 'date':
      return <Calendar className={className} />;
    case 'email':
      return <Mail className={className} />;
    case 'file':
      return <File className={className} />;
    case 'multiSelect':
      return <ListChecks className={className} />;
    case 'number':
      return <Hash className={className} />;
    case 'phone':
      return <Smartphone className={className} />;
    case 'select':
      return <ListCheck className={className} />;
    case 'text':
      return <Text className={className} />;
    case 'url':
      return <Link className={className} />;
    case 'updatedAt':
      return <Calendar className={className} />;
    case 'updatedBy':
      return <User className={className} />;
    default:
      return <ShieldQuestion className={className} />;
  }
};
