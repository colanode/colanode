import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useI18n } from '@colanode/ui/contexts/i18n';

interface SelectOptionDeleteDialogProps {
  fieldId: string;
  optionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SelectOptionDeleteDialog = ({
  fieldId,
  optionId,
  open,
  onOpenChange,
}: SelectOptionDeleteDialogProps) => {
  const { t } = useI18n();
  const database = useDatabase();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('field.deleteOptionConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('field.deleteOptionDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              database.deleteSelectOption(fieldId, optionId);
            }}
          >
            {t('common.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
