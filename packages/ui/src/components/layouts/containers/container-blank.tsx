export const ContainerBlank = () => {
  return (
    <div className="h-full w-full bg-white flex flex-col gap-1">
      <div className="h-10 app-drag-region"></div>
      <div className="flex-grow flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          What did you get done this week?
        </p>
      </div>
    </div>
  );
};
