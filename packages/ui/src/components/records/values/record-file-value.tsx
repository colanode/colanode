import { inArray, useLiveQuery } from '@tanstack/react-db';
import { Paperclip, X } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { LocalFileNode } from '@colanode/client/types';
import { FileFieldAttributes, StringArrayFieldValue } from '@colanode/core';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { FileImageThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { Button } from '@colanode/ui/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';
import { canPreviewFile , openFileDialog } from '@colanode/ui/lib/files';

interface RecordFileValueProps {
    field: FileFieldAttributes;
    readOnly?: boolean;
}

const FileBadge = ({ file }: { file: LocalFileNode }) => {
    const workspace = useWorkspace();
    const canPreview = canPreviewFile(file.subtype);
    return (
        <div className="flex min-w-0 flex-row items-center gap-1">
            {canPreview ? (
                <FileImageThumbnail
                    userId={workspace.userId}
                    file={file}
                    className="size-5 rounded"
                />
            ) : (
                <FileIcon mimeType={file.mimeType} className="size-5" />
            )}
            <p className="line-clamp-1 w-full text-sm">{file.name}</p>
        </div>
    );
};

export const RecordFileValue = ({ field, readOnly }: RecordFileValueProps) => {
    const workspace = useWorkspace();
    const record = useRecord();
    const { mutate, isPending } = useMutation();
    const { value, setValue, clearValue } = useRecordField<StringArrayFieldValue>(
        {
            field,
        }
    );

    const [open, setOpen] = useState(false);

    const fileIds = useMemo(() => value?.value ?? [], [value]);
    const filesQuery = useLiveQuery(
        (q) => {
            if (fileIds.length === 0) {
                return q
                    .from({ nodes: workspace.collections.nodes })
                    .where(({ nodes }) => inArray(nodes.id, ['']));
            }

            return q
                .from({ nodes: workspace.collections.nodes })
                .where(({ nodes }) => inArray(nodes.id, fileIds));
        },
        [workspace.userId, fileIds]
    );

    const files = filesQuery.data
        .filter((node) => node.type === 'file')
        .map((node) => node as LocalFileNode);

    const removeFile = (fileId: string) => {
        if (!record.canEdit || readOnly) return;

        const next = fileIds.filter((id) => id !== fileId);
        if (next.length === 0) {
            clearValue();
        } else {
            setValue({ type: 'string_array', value: next });
        }
    };

    const handleUpload = async () => {
        if (!record.canEdit || readOnly) return;

        const result = await openFileDialog({ multiple: true });
        if (result.type === 'error') {
            toast.error(result.error);
            return;
        }

        if (result.type !== 'success') {
            return;
        }

        const newIds: string[] = [];
        for (const tempFile of result.files) {
            await mutate({
                input: {
                    type: 'file.create',
                    userId: workspace.userId,
                    parentId: record.id,
                    tempFileId: tempFile.id,
                },
                onSuccess: (output) => {
                    if (output.id) {
                        newIds.push(output.id);
                    }
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            });
        }

        if (newIds.length > 0) {
            setValue({ type: 'string_array', value: [...fileIds, ...newIds] });
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="flex h-full w-full cursor-pointer flex-wrap items-center gap-1 overflow-hidden p-0">
                    {files.slice(0, 1).map((file) => (
                        <FileBadge key={file.id} file={file} />
                    ))}
                    {files.length === 0 && ' '}
                    {files.length > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                            +{files.length - 1}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
                <div className="flex flex-col flex-wrap gap-2 p-2">
                    {files.length > 0 ? (
                        <Fragment>
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex w-full flex-row items-center gap-2"
                                >
                                    <FileBadge file={file} />
                                    {record.canEdit && !readOnly && (
                                        <X
                                            className="ml-auto size-4 shrink-0 cursor-pointer"
                                            onClick={() => removeFile(file.id)}
                                        />
                                    )}
                                </div>
                            ))}
                            <Separator className="my-2 w-full" />
                        </Fragment>
                    ) : (
                        <p className="text-sm text-muted-foreground">No files</p>
                    )}
                </div>
                {record.canEdit && !readOnly && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        disabled={isPending}
                        onClick={handleUpload}
                    >
                        <Paperclip className="size-4" />
                        {isPending ? 'Uploading...' : 'Upload files'}
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
};
