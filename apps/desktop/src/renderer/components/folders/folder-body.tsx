import { FolderNode } from '@colanode/core';
import {
  Check,
  Filter,
  GalleryVertical,
  LayoutGrid,
  List,
  Upload,
} from 'lucide-react';
import React from 'react';

import { FolderFiles } from '@/renderer/components/folders/folder-files';
import { Button } from '@/renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Dropzone } from '@/renderer/components/ui/dropzone';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { FolderLayoutType } from '@/shared/types/folders';
import { toast } from '@/renderer/hooks/use-toast';

export type FolderLayout = {
  value: FolderLayoutType;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

export const folderLayouts: FolderLayout[] = [
  {
    name: 'Grid',
    value: 'grid',
    description: 'Show files in grid layout',
    icon: LayoutGrid,
  },
  {
    name: 'List',
    value: 'list',
    description: 'Show files in list layout',
    icon: List,
  },
  {
    name: 'Gallery',
    value: 'gallery',
    description: 'Show files in gallery layout',
    icon: GalleryVertical,
  },
];

interface FolderBodyProps {
  folder: FolderNode;
}

export const FolderBody = ({ folder }: FolderBodyProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const [layout, setLayout] = React.useState<FolderLayoutType>('grid');
  const isDialogOpenedRef = React.useRef(false);

  const currentLayout =
    folderLayouts.find((l) => l.value === layout) ?? folderLayouts[0];

  const openFileDialog = async () => {
    if (isDialogOpenedRef.current) {
      return;
    }

    isDialogOpenedRef.current = true;
    const result = await window.colanode.executeCommand({
      type: 'file_dialog_open',
      options: {
        properties: ['openFile'],
        buttonLabel: 'Upload',
        title: 'Upload files to folder',
      },
    });

    if (result.canceled) {
      isDialogOpenedRef.current = false;
      return;
    }

    const filePath = result.filePaths[0];

    if (!filePath) {
      isDialogOpenedRef.current = false;
      return;
    }

    mutate({
      input: {
        type: 'file_create',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        userId: workspace.userId,
        filePath,
        parentId: folder.id,
      },
      onError(error) {
        toast({
          title: 'Failed to upload file',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    isDialogOpenedRef.current = false;
  };

  return (
    <Dropzone
      text="Drop files here to upload them in the folder"
      onDrop={(files) => {
        files.forEach((file) => console.log(file));
      }}
    >
      <div className="flex h-full max-h-full flex-col gap-4 overflow-y-auto px-10 pt-4">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <Button type="button" variant="outline" onClick={openFileDialog}>
              <Upload className="mr-2 size-4" /> Upload
            </Button>
          </div>
          <div className="flex flex-row gap-2">
            <Button type="button" variant="outline" size="icon" disabled>
              <Filter className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  {currentLayout && <currentLayout.icon className="size-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-5 w-56">
                <DropdownMenuLabel>Layout</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {folderLayouts.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => setLayout(item.value)}
                  >
                    <div className="flex w-full flex-row items-center gap-2">
                      <item.icon className="size-4" />
                      <p className="flex-grow">{item.name}</p>
                      {layout === item.value && <Check className="size-4" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <ScrollArea className="flex-grow">
          <FolderFiles id={folder.id} name="Folder" layout={layout} />
        </ScrollArea>
      </div>
      {/* <FolderUploads
        uploads={Object.values(uploads)}
        open={openUploads}
        setOpen={setOpenUploads}
      /> */}
    </Dropzone>
  );
};
