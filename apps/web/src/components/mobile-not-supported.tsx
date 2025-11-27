import { Smartphone } from 'lucide-react';

export const MobileNotSupported = () => {
  return (
    <div className="min-w-screen flex h-full min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center w-lg">
        <Smartphone className="h-10 w-10 text-foreground" />
        <h2 className="text-4xl text-foreground">Mobile not supported</h2>
        <p className="text-sm text-muted-foreground">
          Hey there! Thanks for checking out Colanode.
        </p>
        <p className="text-sm text-muted-foreground">
          Right now, Colanode is not quite ready for mobile devices just yet.
          For the best experience, please hop onto a desktop or laptop. We're
          working hard to bring you an awesome mobile experience soon.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Thanks for your patience and support!
        </p>
      </div>
    </div>
  );
};
