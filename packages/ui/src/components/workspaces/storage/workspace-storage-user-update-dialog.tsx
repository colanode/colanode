import { eq, useLiveQuery } from '@tanstack/react-db';
import { useForm } from '@tanstack/react-form';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { WorkspaceStorageUser } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const UNITS = [
  { label: 'TB', value: 'TB', bytes: 1024 ** 4 },
  { label: 'GB', value: 'GB', bytes: 1024 ** 3 },
  { label: 'MB', value: 'MB', bytes: 1024 ** 2 },
  { label: 'KB', value: 'KB', bytes: 1024 },
  { label: 'Bytes', value: 'bytes', bytes: 1 },
];

const convertBytesToUnit = (bytes: string) => {
  const bytesNum = parseInt(bytes);
  if (isNaN(bytesNum) || bytesNum === 0) {
    return { value: '0', unit: 'bytes' };
  }

  for (const unit of UNITS) {
    if (bytesNum >= unit.bytes || unit.value === 'bytes') {
      const value = bytesNum / unit.bytes;
      return {
        value: value % 1 === 0 ? value.toString() : value.toFixed(2),
        unit: unit.value,
      };
    }
  }
  return { value: '0', unit: 'bytes' };
};

const convertUnitToBytes = (value: string, unit: string): string => {
  const unitData = UNITS.find((u) => u.value === unit);
  const selectedUnit = unitData || UNITS[UNITS.length - 1]!;
  const numValue = parseFloat(value || '0');
  return Math.round(numValue * selectedUnit.bytes).toString();
};

const formatBytes = (bytes: string): string => {
  const num = parseInt(bytes);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat().format(num);
};

const formSchema = z.object({
  storageLimit: z.string().min(1, 'Storage limit is required'),
  maxFileSize: z.string().min(1, 'Max file size is required'),
});

interface WorkspaceStorageUserUpdateDialogProps {
  user: WorkspaceStorageUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const WorkspaceStorageUserUpdateDialog = ({
  user,
  open,
  onOpenChange,
  onUpdate,
}: WorkspaceStorageUserUpdateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const initialStorageLimit = convertBytesToUnit(user.storageLimit);
  const initialMaxFileSize = convertBytesToUnit(user.maxFileSize);

  const [storageLimitUnit, setStorageLimitUnit] = useState(
    initialStorageLimit.unit
  );
  const [maxFileSizeUnit, setMaxFileSizeUnit] = useState(
    initialMaxFileSize.unit
  );

  const userQuery = useLiveQuery(
    (q) =>
      q
        .from({ users: workspace.collections.users })
        .where(({ users }) => eq(users.id, user.id))
        .select(({ users }) => ({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          email: users.email,
        }))
        .findOne(),
    [workspace.userId, user.id]
  );

  const name = userQuery.data?.name ?? 'Unknown';
  const email = userQuery.data?.email ?? '';
  const avatar = userQuery.data?.avatar ?? null;

  const form = useForm({
    defaultValues: {
      storageLimit: initialStorageLimit.value,
      maxFileSize: initialMaxFileSize.value,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (isPending) {
        return;
      }

      const apiValues = {
        storageLimit: convertUnitToBytes(value.storageLimit, storageLimitUnit),
        maxFileSize: convertUnitToBytes(value.maxFileSize, maxFileSizeUnit),
      };

      if (BigInt(apiValues.maxFileSize) > BigInt(apiValues.storageLimit)) {
        toast.error('Max file size cannot be larger than storage limit');
        return;
      }

      mutate({
        input: {
          type: 'user.storage.update',
          accountId: workspace.accountId,
          workspaceId: workspace.workspaceId,
          userId: user.id,
          storageLimit: apiValues.storageLimit,
          maxFileSize: apiValues.maxFileSize,
        },
        onSuccess: () => {
          toast.success('User storage settings updated');
          form.reset();
          onUpdate();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    },
  });

  const handleCancel = () => {
    form.reset();
    setStorageLimitUnit(initialStorageLimit.unit);
    setMaxFileSizeUnit(initialMaxFileSize.unit);
    onOpenChange(false);
  };

  const storageLimitUnitData = UNITS.find((u) => u.value === storageLimitUnit);
  const storageLimitUnitLabel = storageLimitUnitData?.label ?? 'bytes';
  const maxFileSizeUnitData = UNITS.find((u) => u.value === maxFileSizeUnit);
  const maxFileSizeUnitLabel = maxFileSizeUnitData?.label ?? 'bytes';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update storage settings</DialogTitle>
          <DialogDescription>
            Update the storage limits for this user
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-3 py-4 border-b">
          <Avatar id={user.id} name={name} avatar={avatar} />
          <div className="grow min-w-0">
            <p className="text-sm font-medium leading-none truncate">{name}</p>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grow space-y-6 py-2 pb-4">
            <FieldGroup>
              <form.Field
                name="storageLimit"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Storage Limit
                      </FieldLabel>
                      <div className="flex space-x-2">
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          placeholder="5"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="flex-1"
                          min="1"
                          step="1"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-20 justify-between"
                            >
                              {storageLimitUnitLabel}
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {UNITS.map((unit) => (
                              <DropdownMenuItem
                                key={unit.value}
                                onClick={() => setStorageLimitUnit(unit.value)}
                                className="flex items-center justify-between"
                              >
                                <span>{unit.label}</span>
                                {storageLimitUnit === unit.value && (
                                  <Check className="h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ={' '}
                        {formatBytes(
                          convertUnitToBytes(
                            field.state.value || '0',
                            storageLimitUnit
                          )
                        )}{' '}
                        bytes
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="maxFileSize"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Max File Size
                      </FieldLabel>
                      <div className="flex space-x-2">
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          placeholder="10"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="flex-1"
                          min="1"
                          step="1"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-20 justify-between"
                            >
                              {maxFileSizeUnitLabel}
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {UNITS.map((unit) => (
                              <DropdownMenuItem
                                key={unit.value}
                                onClick={() => setMaxFileSizeUnit(unit.value)}
                                className="flex items-center justify-between"
                              >
                                <span>{unit.label}</span>
                                {maxFileSizeUnit === unit.value && (
                                  <Check className="h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ={' '}
                        {formatBytes(
                          convertUnitToBytes(
                            field.state.value || '0',
                            maxFileSizeUnit
                          )
                        )}{' '}
                        bytes
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-1" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
