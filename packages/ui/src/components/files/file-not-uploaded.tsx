import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { useI18n } from '@colanode/ui/contexts/i18n';

interface FileNotUploadedProps {
  mimeType: string;
}

export const FileNotUploaded = ({ mimeType }: FileNotUploadedProps) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center gap-3">
      <FileIcon mimeType={mimeType} className="h-10 w-10" />
      <p className="text-sm text-muted-foreground text-center">
        {t('common.loading')}
      </p>
    </div>
  );
};
