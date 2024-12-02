import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/renderer/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Input } from '@/renderer/components/ui/input';
import { Spinner } from '@/renderer/components/ui/spinner';
import { Textarea } from '@/renderer/components/ui/textarea';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
});

interface SpaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpaceCreateDialog = ({
  open,
  onOpenChange,
}: SpaceCreateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isPending) {
      return;
    }

    if (values.name.length < 3) {
      return;
    }

    mutate({
      input: {
        type: 'space_create',
        name: values.name,
        description: values.description,
        userId: workspace.userId,
        workspaceId: workspace.id,
      },
      onSuccess() {
        onOpenChange(false);
        form.reset();
      },
      onError(error) {
        toast({
          title: 'Failed to create space',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create space</DialogTitle>
          <DialogDescription>
            Create a new space to collaborate with your peers
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex-grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a short description about the workspace"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
