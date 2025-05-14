import { NodeRole } from '@colanode/core';
import {
  Check,
  Filter,
  GalleryVertical,
  LayoutGrid,
  List,
  Upload,
} from 'lucide-react';
import React from 'react';
import { LocalFolderNode, FolderLayoutType } from '@colanode/client/types';
import { FolderFiles } from '@colanode/ui/components/folders/folder-files';
import { Button } from '@colanode/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { Dropzone } from '@colanode/ui/components/ui/dropzone';
import { ScrollArea } from '@colanode/ui/components/ui/scroll-area';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { toast } from '@colanode/ui/hooks/use-toast';

export type FolderLayoutOption = {
  value: FolderLayoutType;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  enabled: boolean;
};

export const folderLayouts: FolderLayoutOption[] = [
  {
    name: 'Grid',
    value: 'grid',
    description: 'Show files in grid layout',
    icon: LayoutGrid,
    enabled: true,
  },
  {
    name: 'List',
    value: 'list',
    description: 'Show files in list layout',
    icon: List,
    enabled: false,
  },
  {
    name: 'Gallery',
    value: 'gallery',
    description: 'Show files in gallery layout',
    icon: GalleryVertical,
    enabled: false,
  },
];

interface FolderBodyProps {
  folder: LocalFolderNode;
  role: NodeRole;
}

export const FolderBody = ({ folder }: FolderBodyProps) => {
  const workspace = useWorkspace();

  const [layout, setLayout] = React.useState<FolderLayoutType>('grid');
  const isDialogOpenedRef = React.useRef(false);

  const currentLayout =
    folderLayouts.find((l) => l.value === layout) ?? folderLayouts[0];

  const openFileDialog = async () => {
    if (isDialogOpenedRef.current) {
      return;
    }

    isDialogOpenedRef.current = true;
    const commandResult = await window.colanode.executeCommand({
      type: 'file_dialog_open',
      options: {
        properties: ['openFile'],
        buttonLabel: 'Upload',
        title: 'Upload files to folder',
      },
    });

    if (commandResult.canceled) {
      isDialogOpenedRef.current = false;
      return;
    }

    const filePath = commandResult.filePaths[0];

    if (!filePath) {
      isDialogOpenedRef.current = false;
      return;
    }

    const mutationResult = await window.colanode.executeMutation({
      type: 'file_create',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      filePath,
      parentId: folder.id,
    });

    if (!mutationResult.success) {
      toast({
        title: 'Failed to upload file',
        description: mutationResult.error.message,
        variant: 'destructive',
      });
    }

    isDialogOpenedRef.current = false;
  };

  return (
    <Dropzone
      text="Drop files here to upload them in the folder"
      onDrop={(files) => {
        files.forEach((file) => console.log(file));
      }}
    >
      <div className="flex h-full max-h-full flex-col gap-4 overflow-y-auto">
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
                    disabled={!item.enabled}
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
