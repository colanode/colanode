import { Fragment, useEffect, useState } from 'react';

interface DelayedComponentProps {
  children: React.ReactNode;
  delay?: number;
}

const DelayedComponent = ({ children, delay }: DelayedComponentProps) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay ?? 100);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldRender ? <Fragment>{children}</Fragment> : null;
};

DelayedComponent.displayName = 'DelayedComponent';

export { DelayedComponent };
