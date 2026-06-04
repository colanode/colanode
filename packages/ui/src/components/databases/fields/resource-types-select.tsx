import { Checkbox } from '@colanode/ui/components/ui/checkbox';

const RESOURCE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'channel', label: 'Channels' },
    { value: 'database', label: 'Databases' },
    { value: 'page', label: 'Pages' },
    { value: 'folder', label: 'Folders' },
    { value: 'file', label: 'Files' },
    { value: 'record', label: 'Records' },
    { value: 'chat', label: 'Chats' },
    { value: 'user', label: 'Users' },
    { value: 'space', label: 'Spaces' },
];

interface ResourceTypesSelectProps {
    value: string[] | null;
    onChange: (value: string[] | null) => void;
}

export const ResourceTypesSelect = ({
    value,
    onChange,
}: ResourceTypesSelectProps) => {
    const selected = new Set(value ?? []);
    const allSelected = selected.size === 0;

    const toggle = (type: string) => {
        const next = new Set(selected);
        if (next.has(type)) {
            next.delete(type);
        } else {
            next.add(type);
        }
        onChange(next.size === 0 ? null : Array.from(next));
    };

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
                {allSelected
                    ? 'All resource types are allowed.'
                    : `${selected.size} type(s) allowed.`}
            </p>
            <div className="grid grid-cols-2 gap-2">
                {RESOURCE_TYPE_OPTIONS.map((opt) => {
                    const checked = allSelected || selected.has(opt.value);
                    return (
                        <label
                            key={opt.value}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggle(opt.value)}
                            />
                            <span>{opt.label}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};
