import React from 'react';

interface DelayedComponentProps {
  children: React.ReactNode;
  delay?: number;
}

const DelayedComponent = ({ children, delay }: DelayedComponentProps) => {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay ?? 100);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldRender ? <React.Fragment>{children}</React.Fragment> : null;
};

DelayedComponent.displayName = 'DelayedComponent';

export { DelayedComponent };
