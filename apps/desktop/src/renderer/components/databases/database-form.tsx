import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/renderer/components/ui/input';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { AvatarPopover } from '@/renderer/components/avatars/avatar-popover';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().optional().nullable(),
});

interface DatabaseFormProps {
  id: string;
  values: z.infer<typeof formSchema>;
  isPending: boolean;
  submitText: string;
  handleCancel: () => void;
  handleSubmit: (values: z.infer<typeof formSchema>) => void;
  readOnly?: boolean;
}

export const DatabaseForm = ({
  id,
  values,
  isPending,
  submitText,
  handleCancel,
  handleSubmit,
  readOnly = false,
}: DatabaseFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: values,
  });

  const name = form.watch('name');
  const avatar = form.watch('avatar');

  return (
    <Form {...form}>
      <form
        className="flex flex-col"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="flex-grow flex flex-row items-end gap-2 py-2 pb-4">
          {readOnly ? (
            <Button type="button" variant="outline" size="icon">
              <Avatar id={id} name={name} avatar={avatar} className="h-6 w-6" />
            </Button>
          ) : (
            <AvatarPopover
              onPick={(avatar) => {
                if (isPending) return;
                if (avatar === values.avatar) return;

                form.setValue('avatar', avatar);
              }}
            >
              <Button type="button" variant="outline" size="icon">
                <Avatar
                  id={id}
                  name={name}
                  avatar={avatar}
                  className="h-6 w-6"
                />
              </Button>
            </AvatarPopover>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input readOnly={readOnly} placeholder="Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || readOnly}>
            {isPending && <Spinner className="mr-1" />}
            {submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
};