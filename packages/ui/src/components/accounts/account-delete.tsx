import { Button } from '@colanode/ui/components/ui/button';

export const AccountDelete = () => {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold">Delete account</h3>
        <p className="text-sm text-muted-foreground">
          Account delete will be available soon.
        </p>
      </div>
      <div className="flex-shrink-0">
        <Button variant="destructive" className="w-20" disabled>
          Delete
        </Button>
      </div>
    </div>
  );
};
